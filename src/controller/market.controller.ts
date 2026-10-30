import type { Request, Response } from "express";
import { marketSchema } from "../types/market.types";
import { prisma } from "../db/client";

export const createMarket = async (req: Request, res: Response) => {
  const result = marketSchema.safeParse(req.body);
  const { userId } = req;
  try {
    if (!result.success) {
      throw new Error("Market types are not valid");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    const isMarketExit = await prisma.market.findFirst({
      where: {
        title: result.data.title,
      },
    });
    if (isMarketExit) {
      return res.status(400).json({
        success: false,
        message: "Market already exit with this title",
      });
    }

    const newMarket = await prisma.market.create({
      data: {
        createrId: userId,
        title: result.data.title,
        initialWager: result.data.initialWager,
        expiry: result.data.expiry,
        resolution: result.data.resolution,
        bet: result.data.bet,
      },
    });

    res.status(200).json({
      success: true,
      message: "Market created successfully",
      market: newMarket,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const placeBet = async (req: Request, res: Response) => {
  const { marketId } = req.params;
  const amount = req.body.amount;
  const { userId } = req;

  if (!marketId || typeof marketId !== "string") {
    return res.status(400).json({
      success: false,
      message: "marketId must be a valid string",
    });
  } else if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User ID missing",
    });
  }

  try {
    const market = await prisma.market.findFirst({
      where: {
        id: marketId,
      },
      select: {
        resolution: true,
        createrId: true,
        initialWager: true,
      },
    });
    if (!market) {
      res.status(400).json({
        success: false,
        message: "Market does not exit",
      });
    }
    console.log(market?.resolution, "is market resolved");

    if (market?.resolution === "YES") {
      return res.status(400).json({
        success: false,
        message: "Market is already resolved",
      });
    }
    console.log("belwo market resolved");
    if (market?.createrId === userId) {
      return res.status(400).json({
        success: false,
        message: "Market creater can't bet against their own market",
      });
    }

    const existingBets = await prisma.bet.findMany({
      where: {
        markedId: marketId,
      },
    });

    const totalBet = existingBets.reduce((sum, bet) => sum + bet.betAmount, 0);

    if (totalBet + amount > market?.initialWager!) {
      return res.status(400).json({
        succes: true,
        message: "Bet exceeded remaining available amount",
      });
    }

    const userBalance = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        balance: true,
      },
    });

    if (userBalance?.balance! < amount) {
      return res.status(400).json({
        success: false,
        message: "You don't have the sufficient balance to place bet",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const debitUserBalance = await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      const placeBet = await tx.bet.create({
        data: {
          userId: userId,
          betAmount: amount,
          markedId: marketId,
        },
      });

      const walletEvent = await tx.walletEvent.create({
        data: {
          tx_type: "bet",
          externalId: {
            betId: placeBet.id,
            marketId: marketId,
          },
          amount: amount,
        },
      });

      return {
        user: debitUserBalance,
        bet: placeBet,
        walletEvent,
      };
    });

    res.status(400).json({
      success: true,
      message: "Bet placed successfully",
      result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const allMarkets = await prisma.market.findMany({});

    const totalBets = await prisma.bet.groupBy({
      by: ["markedId"],
      _sum: {
        betAmount: true,
      },
    });

    const marketWithRemainingWager = allMarkets.map((market) => {
      const totalWager =
        totalBets.find((bet) => bet.markedId === market.id)?._sum.betAmount ??
        0;

      return {
        ...market,
        remainingWager: market.initialWager - totalWager,
      };
    });

    res.status(200).json({
      success: true,
      message: "All markets",
      data: marketWithRemainingWager,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBets = async (req: Request, res: Response) => {
  const { userId } = req;
  try {
    const bets = await prisma.bet.findFirst({
      where: {
        userId,
      },
      select: {
        market: true,
        user: {
          include: {
            bets: true,
          },
        },
      },
    });
    res.status(200).json({
      success: true,
      message: "All bets",
      bets,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const resolve = async (req: Request, res: Response) => {
  const resolution = req.body.resolution;
  const { marketId } = req.params;
  const { userId } = req;
  if (!marketId || typeof marketId !== "string") {
    return res.status(400).json({
      sucess: false,
      message: "marketId can't be empty",
    });
  } else if (!userId) {
    return res.status(400).json({
      sucess: false,
      message: "CreaterId can't be empty",
    });
  }
  try {
    const market = await prisma.market.findFirst({
      where: {
        id: marketId,
      },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market doesn't exits",
      });
    }

    if (market.createrId !== userId) {
      return res.status(400).json({
        success: false,
        message: "Only creater can resolve the market",
      });
    }

    if (market.resolution !== null) {
      return res.status(400).json({
        success: false,
        message: "This market is already resolved",
      });
    }

    const bets = await prisma.bet.findMany({
      where: {
        markedId: market.id,
      },
    });

    const totalBets = bets.reduce((sum, bet) => sum + bet.betAmount, 0);

    const result = await prisma.$transaction(async (tx) => {
      let totalPayout = 0;
      let refund = 0;

      if (market.bet === resolution) {
        // if creator won
        totalPayout = totalBets * 2 + (market.initialWager - totalBets);

        const creator = await tx.user.update({
          where: { id: market.createrId },
          data: {
            balance: { increment: totalPayout },
          },
        });

        await tx.walletEvent.create({
          data: {
            tx_type: "payout",
            amount: totalPayout,
            externalId: { marketId },
          },
        });

        return {
          marketId,
          resolution,
          winner: market.createrId,
          totalPayout,
          refund: 0,
          balance: creator.balance,
        };
      } else {
        // Other bettors won
        for (const bet of bets) {
          const payout = bet.betAmount * 2;

          await tx.user.update({
            where: {
              id: bet.userId, // use the bettor's id, not the market creator's userId
            },
            data: {
              balance: { increment: payout },
            },
          });

          await tx.walletEvent.create({
            data: {
              tx_type: "payout",
              amount: payout,
              externalId: { marketId },
            },
          });

          totalPayout += payout;
        }

        // Refund unmatched creator stake
        refund = market.initialWager - totalBets;

        if (refund > 0) {
          await tx.user.update({
            where: { id: market.createrId },
            data: {
              balance: { increment: refund },
            },
          });

          await tx.walletEvent.create({
            data: {
              tx_type: "refund",
              externalId: { marketId },
              amount: refund,
            },
          });
        }

        return {
          marketId,
          resolution,
          winner: "bettors",
          totalPayout,
          refund,
        };
      }
    });
    return res.status(200).json({
      success: true,
      message: "Market resolved successfully",
      data: result,
    });
  } catch (error:any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
