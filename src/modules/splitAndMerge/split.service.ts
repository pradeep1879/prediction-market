import { prisma } from "../../db/client"
import { AppError } from "../../utils/AppError"

export const splitMarket = async(userId:string, marketId:string, quantity:number) => {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
  });

  if (!market) {
    throw new AppError(404, "Market does not exist");
  }
  if (market.status !== "OPEN") {
    throw new AppError(400, "This market is not open");
  }

  const collateralAmount = quantity * market.payoutPerContract;

  const wallet = await prisma.wallet.findUnique({
    where: { userId: userId },
  });

  if (!wallet) {
    throw new AppError(404, "User wallet does not exist");
  }

  if (wallet.status !== "ACTIVE") {
    throw new AppError(403, "Wallet is not active");
  }

  if (wallet.availableBalance < collateralAmount) {
    throw new AppError(400, "Your balance is not sufficient");
  }

  return prisma.$transaction(async(tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: collateralAmount }
      }
    });

    await tx.collateralPool.upsert({
      where: { marketId },
      create:{
        marketId, 
        lockedAmount: collateralAmount
      },
      update: {
        lockedAmount: { increment: collateralAmount }
      }
    });

    // create or increase yes postions
    await tx.position.upsert({
      where: {
        userId_marketId_outcome: {
          userId,
          marketId,
          outcome: "YES"
        }
      },
      create:{
        userId, marketId, 
        outcome: "YES",
        quantity
      },
      update:{
        quantity:{ increment: quantity }
      }
    });

    // create or increase no positions
    await tx.position.upsert({
      where:{
        userId_marketId_outcome: {
          userId,
          marketId,
          outcome: "NO"
        }
      },
      create:{
        userId,
        marketId,
        outcome: "NO",
        quantity
      },
      update:{
        quantity: { increment: quantity }
      }
    });


    // create ledger transaction
    const ledgerTransaction = await tx.ledgerTransaction.create({
      data:{
        referenceType: "SPLIT",
        referenceId: marketId,
        idempotencyKey: `split_${crypto.randomUUID()}`,
        status: "COMPLETED",
        postedAt: new Date(),
      }
    });


    const walletAccount  = await tx.ledgerAccount.findUnique({
      where:{ 
        walletId_accountType: {
          walletId: wallet.id,
          accountType: "USER_AVAILABLE",
        }
      }
    });

    const collateralAccount = await tx.ledgerAccount.findUnique({
      where:{
        marketId_accountType:{
          marketId,
          accountType: "MARKET_COLLATERAL",
        }
      }
    });

    if (!walletAccount || !collateralAccount) {
      throw new AppError(404, "Required ledger accounts not found");
    }


    // create balanced ledger entries
    await tx.ledgerEntry.createMany({
      data:[
        {
          transactionId: ledgerTransaction.id,
          accountId: walletAccount.id,
          amount: collateralAmount,
          direction: "DEBIT"
        },
        {
          transactionId: ledgerTransaction.id,
          accountId: collateralAccount.id,
          amount: collateralAmount,
          direction: "CREDIT"
        }
      ]
    })

    const splitOperation = await tx.splitMergeOperation.create({
      data:{
        userId,
        marketId,
        ledgerTransactionId: ledgerTransaction.id,
        operationType: "SPLIT",
        quantity,
        collateralAmount,
        status: "COMPLETED",
        completedAt: new Date()
      }
    });


    return {
      quantity,
      collateralAmount,
      splitOperation
    }
  });
}


export const mergeMarket = async(userId:string, marketId:string, quantity:number) => {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
  });

  if (!market) {
    throw new AppError(404, "Market does not exist");
  }
  if (market.status === "RESOLVED" || market.status === "CANCELLED") {
    throw new AppError(400, "Cannot merge a resolved or cancelled market");
  }
  
  const collateralAmount = quantity * market.payoutPerContract;
  
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });
  
  if (!wallet) {
    throw new AppError(404, "User wallet does not exist");
  }
  
  if (wallet.status !== "ACTIVE") {
    throw new AppError(403, "Wallet is not active");
  }
  
  return prisma.$transaction(async(tx) => {
    // find yes not positions
    const yesPosition = await tx.position.findUnique({
      where:{
        userId_marketId_outcome:{
          userId, marketId,
          outcome: "YES"
        }
      }
    });
    

    const noPosition = await tx.position.findUnique({
      where:{
        userId_marketId_outcome:{
          userId, marketId,
          outcome:"NO"
        }
      }
    });

    
    if(!yesPosition || !noPosition){
      throw new AppError(400, "Insufficent YES and NO positions");
    }
    
    // check available contracts (excluding locked contracts)
    if(
      yesPosition.quantity - yesPosition.lockedQuantity < quantity ||
      noPosition.quantity - noPosition.lockedQuantity < quantity
    ){
      throw new AppError(400, "Insufficient available YES or NO contracts");
    }


    // check collateralPool
    const collateralPool = await tx.collateralPool.findUnique({
      where:{marketId}
    });
    if(!collateralPool || collateralPool.lockedAmount < collateralAmount){
      throw new AppError(400, "Insufficent market collateral")
    };

    // decrease YES position
    const yesUpdated = await tx.position.updateMany({
      where:{
        id: yesPosition.id,
        quantity: { lte: quantity },
        lockedQuantity: { lte: yesPosition.quantity - quantity }
      },
      data:{
        quantity: { decrement: quantity }
      }
    });

    if (yesUpdated.count !== 1) {
      throw new AppError(400, "Unable to merge YES contracts");
    }

    // decrease NO position
    const noUpdated = await tx.position.updateMany({
      where:{
        id: noPosition.id,
        quantity: { lte: quantity },
        lockedQuantity: { lte: noPosition.quantity - quantity }
      },
      data:{
        quantity: { decrement: quantity }
      }
    });
    if (noUpdated.count !== 1) {
      throw new AppError(400, "Unable to merge YES contracts");
    }   

    // release market collateral
    const poolUpdated = await tx.collateralPool.updateMany({
      where:{
        marketId,
        lockedAmount: { lte: collateralAmount }
      },
      data: { lockedAmount: { decrement: collateralAmount } }
    })

    if (poolUpdated.count !== 1) {
      throw new AppError(400, "Insufficient market collateral");
    }


    // credit user's wallet

    await tx.wallet.update({
      where: { id: wallet.id },
      data:{
        availableBalance: { increment: collateralAmount },
      }
    });


    // update market paired burned
    await tx.market.update({
      where: { id: marketId },
      data:{
        totalPairsBurned: { increment: quantity }
      }
    });

    const walletAccount = await tx.ledgerAccount.findUnique({
      where:{
        walletId_accountType:{
          walletId: wallet.id,
          accountType: "USER_AVAILABLE",
        }
      }
    });
    
    const collateralAccount = await tx.ledgerAccount.findUnique({
      where:{
        marketId_accountType:{
          marketId,
          accountType: "MARKET_COLLATERAL"
        }
      }
    });

    if(!walletAccount || !collateralAccount){
      throw new AppError(404, "Required ledger account not found");
    }

    // create ledger transaction
    const ledgerTransaction = await tx.ledgerTransaction.create({
      data: {
        referenceType: "MERGE",
        referenceId: marketId,
        idempotencyKey: `merge_${crypto.randomUUID()}`,
        status: "COMPLETED",
        postedAt: new Date(),
      },
    });

    // ceate ledger entries
    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: ledgerTransaction.id,
          accountId: collateralAccount.id,
          amount: collateralAmount,
          direction: "DEBIT",
        },
        {
          transactionId: ledgerTransaction.id,
          accountId: walletAccount.id,
          amount: collateralAmount,
          direction: "CREDIT",
        },
      ],
    });
    // create merge operation
    const mergeOperation = await tx.splitMergeOperation.create({
      data:{
        userId,
        marketId,
        ledgerTransactionId: ledgerTransaction.id,
        operationType: "MERGE",
        quantity,
        collateralAmount,
        status: "COMPLETED",
        completedAt: new Date()
      }
    });
    return {
      quantity,
      collateralAmount,
      mergeOperation
    }
  },
  {
    isolationLevel: "Serializable"
  });
}
