import { prisma } from "../../db/client"
import { AppError } from "../../utils/AppError"

export const splitMarket = async(userId:string, marketId:string, quantity:number) => {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
  });

  if (!market) {
    throw new AppError(404, "Market does not exist");
  }
  console.log("hi there",1)
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