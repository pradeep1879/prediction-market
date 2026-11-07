import type z from "zod";
import { prisma } from "../../db/client"
import { AppError } from "../../utils/AppError";
import type { placeOrderSchema } from "./order.schema";

type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const placeOrder = async (
  userId: string,
  input: PlaceOrderInput
) => {
  const { marketId, outcome, action, price, quantity, timeInForce } = input;

  const market = await prisma.market.findUnique({
    where: { id: marketId },
  });
  if(!market){
    throw new AppError(404, "Market does not exits.")
  }

  if(market.status !== "OPEN"){
    throw new AppError(400, "This market is not open.")
  }

  const now = new Date();
  if(now < market.tradingStartsAt || now >= market.tradingEndsAt){
    throw new AppError(400, "Market is outside trading hours.")
  }

  // validate price and amount
  if(price < market.minPrice || price > market.maxPrice){
    throw new AppError(400, "Price is outside the allowed range.")
  }

  if((price - market.minPrice) % market.tickSize !== 0){
    throw new AppError(400, "Invalid price tick size");
  }

  if(quantity < market.minOrderQuantity){
    throw new AppError(400, "Quantity is below minimum order quantity");
  }

  // calculate BUY reservation
  const requiredAmount = price * quantity;

  // find wallet or position before transaction
  const wallet = 
    action === "BUY" ? await prisma.wallet.findUnique({ where: { userId } }) : null;

    const position = 
      action === "SELL" ? await prisma.position.findUnique({
        where:{
          userId_marketId_outcome: {
            userId, marketId, outcome
          }
        }
      }) : null;

  if (action === "BUY") {
    if (!wallet) {
      throw new AppError(404, "Wallet does not exist");
    }

    if (wallet.status !== "ACTIVE") {
      throw new AppError(403, "Your wallet is not active");
    }

    if (wallet.availableBalance < requiredAmount) {
      throw new AppError(400, "Insufficient wallet balance");
    }
  }

  if (action === "SELL") {
    if (!position) {
      throw new AppError(400, "You do not own this position");
    }

    const availableQuantity =
      position.quantity - position.lockedQuantity;

    if (availableQuantity < quantity) {
      throw new AppError(400, "Insufficient available contracts");
    }
  }



  return prisma.$transaction(async(tx) => {
    // generate sequence using PostgreSQL sequence
    const sequenceResult = await tx.$queryRaw<
      { value: bigint }[]
      >`SELECT nextval('"order_sequence"') AS value`;

      const sequence = sequenceResult[0]?.value;
      if (sequence === undefined) {
        throw new AppError(500, "Failed to generate order sequence");
      } 

      // create order
      const order = await prisma.order.create({
        data:{
          userId, 
          marketId,
          outcome,
          action,
          price, 
          originalQuantity: quantity,
          filledQuantity: 0,
          timeInForce,
          status: "OPEN",
          sequence,
          idempotencyKey: crypto.randomUUID(),
        },
      });

    // BUY: Reserve wallet balance
    if(action === "BUY" && wallet){
      const updateWallet = await tx.wallet.updateMany({
        where:{
          id: wallet.id,
          status: "ACTIVE",
          availableBalance: {
            gt: requiredAmount,
          }
        },
        data:{
          availableBalance:{
            decrement: requiredAmount,
          },
          reservedBalance:{
            increment: requiredAmount
          }
        }
      });

      if(updateWallet.count !== 1){
        throw new AppError(400, "Insufficient available balance.");
      }

      await tx.orderReservation.create({
        data:{
          orderId: order.id,
          walletId: wallet.id,
          reservationType: "CASH",
          reservedAmount: requiredAmount
        }
      });

      // find wallet ledger accounts
      const accounts = await tx.ledgerAccount.findMany({
        where:{
          walletId: wallet.id,
          accountType: {
            in: ["USER_AVAILABLE", "USER_RESERVED"],
          }
        }
      });

      const availableAccount = accounts.find(
        (accont) => accont.accountType === "USER_AVAILABLE"
      );

      const reservedAccount = accounts.find(
        (account) => account.accountType === "USER_RESERVED"
      );

      const ledgerTransaction = await tx.ledgerTransaction.create({
        data:{
          referenceType: "TRADE",
          referenceId: order.id,
          idempotencyKey: `order_reservation_${order.id}`,
          status: "COMPLETED",
          postedAt: new Date(),
        }
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: ledgerTransaction.id,
            accountId: availableAccount?.id!,
            amount: requiredAmount,
            direction: "DEBIT",
          },
          {
            transactionId: ledgerTransaction.id,
            accountId: reservedAccount?.id!,
            amount: requiredAmount,
            direction: "CREDIT",
          },
        ],
      });
    }


    if(action === "SELL" && position){
      const updatedPosition = await tx.position.updateMany({
        where:{
          id: position.id,
          quantity: { gte: quantity },
          lockedQuantity: {
            lte: position.quantity - quantity,
          },
        },
        data:{
          lockedQuantity: {
            increment: quantity
          }
        }
      });

      if(updatedPosition.count !== 1){
        throw new AppError(400, "Insufficient available contracts");
      }

      await tx.orderReservation.create({
        data:{
          orderId: order.id,
          positionId: position.id,
          reservationType: "CONTRACT",
          reservedQuantity: quantity,
        }
      })
    }


    return {
      order
    }
  },
  {
    isolationLevel: "Serializable"
  }
)
}