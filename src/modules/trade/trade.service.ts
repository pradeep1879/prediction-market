import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../db/client";

type GetUserTradesInput = {
  outcome?: "YES" | "NO";
  page: number;
  limit: number;
}

export const getUserTrades = async (
  userId: string,
  marketId: string, 
  query: GetUserTradesInput
) => {
  const { outcome, page, limit } = query;
/**
 * (buyerId = userId OR sellerId = userId)
    AND status = EXECUTED
    AND marketId = marketId       // only if provided
    AND outcome = outcome         // only if provide
 */
  const where: Prisma.TradeWhereInput = {
    OR: [
      { buyerId: userId },
      { sellerId: userId }
    ],
    status: "EXECUTED",
    ...(marketId && { marketId }),
    ...(outcome && { outcome })
  };

  // fetch trades and total count
  const [trades, total] = await prisma.$transaction([
    prisma.trade.findMany({
      where,
      include:{
        market:{
          select:{
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy:{
        executedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.trade.count({
      where
    }),
  ]);

  // format trades
  const formattedTrades = trades.map((trade) => ({
    ...trade,
    side: trade.buyerId === userId ? "BUY" : "SELL",
    totalAmount: trade.executionPrice * trade.quantity
  }));

  return {
    trades: formattedTrades,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total/limit)
    }
  }
}