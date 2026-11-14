
import { prisma } from "../../db/client";
import { AppError } from "../../utils/AppError";

export const settleMarket = async (
  userId: string,
  marketId: string
) => {
  //  validate admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User does not exist.");
  }

  if (user.status !== "ACTIVE" || user.role !== "ADMIN") {
    throw new AppError(403, "User is not authorized.");
  }

  // find market
  const market = await prisma.market.findUnique({
    where: { id: marketId },
  });

  if (!market) {
    throw new AppError(404, "Market does not exist.");
  }

  if (market.status !== "RESOLVED") {
    throw new AppError(
      400,
      "Market must be resolved before settlement."
    );
  }

  // find confirmed resolution
  const resolution = await prisma.marketResolution.findFirst({
    where: {
      marketId,
      status: "CONFIRMED",
    },
  });

  if (!resolution) {
    throw new AppError(
      400,
      "Market does not have a confirmed resolution."
    );
  }

  if (
    resolution.outcome !== "YES" &&
    resolution.outcome !== "NO"
  ) {
    throw new AppError(400, "Invalid market resolution outcome.");
  }

  if (market.resolution !== resolution.outcome) {
    throw new AppError(
      400,
      "Market outcome does not match confirmed resolution."
    );
  }

  // find or create settlement batch
  const existingBatch = await prisma.settlementBatch.findUnique({
    where: {
      resolutionId: resolution.id,
    },
  });

  let settlementBatch;

  if (!existingBatch) {
    settlementBatch = await prisma.settlementBatch.create({
      data: {
        marketId,
        resolutionId: resolution.id,
        status: "PROCESSING",
        totalWinningQuantity: 0,
        totalPayoutAmount: 0,
        startedAt: new Date(),
      },
    });
  } else {
    switch (existingBatch.status) {
      case "COMPLETED":
        throw new AppError(400, "Market is already settled.");

      case "PROCESSING":
        throw new AppError(
          409,
          "Settlement is already processing."
        );

      case "PENDING":
      case "FAILED":
        settlementBatch = await prisma.settlementBatch.update({
          where: {
            id: existingBatch.id,
          },
          data: {
            status: "PROCESSING",
            startedAt: new Date(),
          },
        });
        break;
    }
  }

  // fetch all market positions
  const allPositions = await prisma.position.findMany({
    where: {
      marketId,
      quantity: {
        gt: 0,
      },
    },
  });

  // ensure no contracts remain locked in open orders
  const hasLockedPositions = allPositions.some(
    (position) => position.lockedQuantity > 0
  );

  if (hasLockedPositions) {
    await prisma.settlementBatch.update({
      where: { id: settlementBatch.id },
      data: { status: "FAILED" },
    });

    throw new AppError(
      400,
      "Cancel open orders and release locked positions before settlement."
    );
  }

  // separate winning and losing positions
  const winningPositions = allPositions.filter(
    (position) => position.outcome === resolution.outcome
  );

  const losingPositions = allPositions.filter(
    (position) => position.outcome !== resolution.outcome
  );

  // calculate total winning quantity and payout
  const totalWinningQuantity = winningPositions.reduce(
    (total, position) => total + position.quantity,
    0
  );

  const totalPayoutAmount =
    totalWinningQuantity * market.payoutPerContract;

  // check market collateral
  const collateralPool = await prisma.collateralPool.findUnique({
    where: {
      marketId,
    },
  });

  if (
    !collateralPool ||
    collateralPool.lockedAmount < totalPayoutAmount
  ) {
    await prisma.settlementBatch.update({
      where: { id: settlementBatch.id },
      data: { status: "FAILED" },
    });

    throw new AppError(
      400,
      "Insufficient market collateral for settlement."
    );
  }

  try {
    // process every position individually
    for (const position of allPositions) {
      const isWinner =
        position.outcome === resolution.outcome;

      const payoutAmount = isWinner
        ? position.quantity * market.payoutPerContract
        : 0;

      const idempotencyKey =
        `SETTLEMENT_${settlementBatch.id}_${position.id}`;

      await prisma.$transaction(async (tx) => {
        // check existing settlement record
        const existingRecord =
          await tx.settlementRecord.findUnique({
            where: {
              batchId_positionId: {
                batchId: settlementBatch.id,
                positionId: position.id,
              },
            },
          });

        // already processed: do not pay again
        if (existingRecord?.status === "COMPLETED") {
          return;
        }

        // create or reuse settlement record
        const settlementRecord =
          await tx.settlementRecord.upsert({
            where: {
              batchId_positionId: {
                batchId: settlementBatch.id,
                positionId: position.id,
              },
            },
            create: {
              batchId: settlementBatch.id,
              marketId,
              userId: position.userId,
              positionId: position.id,
              outcome: position.outcome,
              quantity: position.quantity,
              payoutPerContract: market.payoutPerContract,
              payoutAmount,
              status: "PENDING",
            },
            update: {
              status: "PENDING",
            },
          });

        // process winner payout
        if (isWinner && payoutAmount > 0) {
          const wallet = await tx.wallet.findUnique({
            where: {
              userId: position.userId,
            },
          });

          if (!wallet) {
            throw new AppError(
              404,
              `Wallet not found for user ${position.userId}.`
            );
          }

          // find ledger accounts
          const [userAccount, marketAccount] =
            await Promise.all([
              tx.ledgerAccount.findFirst({
                where: {
                  walletId: wallet.id,
                  accountType: "USER_AVAILABLE",
                },
              }),

              tx.ledgerAccount.findFirst({
                where: {
                  marketId,
                  accountType: "MARKET_COLLATERAL",
                },
              }),
            ]);

          if (!userAccount || !marketAccount) {
            throw new AppError(
              500,
              "Required ledger accounts not found."
            );
          }

          // deduct market collateral
          const collateralUpdate =
            await tx.collateralPool.updateMany({
              where: {
                marketId,
                lockedAmount: {
                  gte: payoutAmount,
                },
              },
              data: {
                lockedAmount: {
                  decrement: payoutAmount,
                },
              },
            });

          if (collateralUpdate.count !== 1) {
            throw new AppError(
              400,
              "Insufficient market collateral."
            );
          }

          // credit winner wallet
          await tx.wallet.update({
            where: {
              id: wallet.id,
            },
            data: {
              availableBalance: {
                increment: payoutAmount,
              },
            },
          });

          // create ledger transaction
          const ledgerTransaction =
            await tx.ledgerTransaction.create({
              data: {
                referenceType: "SETTLEMENT",
                referenceId: settlementRecord.id,
                idempotencyKey,
                status: "COMPLETED",
                postedAt: new Date(),
              },
            });

          // create balanced ledger entries
          await tx.ledgerEntry.createMany({
            data: [
              {
                transactionId: ledgerTransaction.id,
                accountId: marketAccount.id,
                amount: payoutAmount,
                direction: "DEBIT",
              },
              {
                transactionId: ledgerTransaction.id,
                accountId: userAccount.id,
                amount: payoutAmount,
                direction: "CREDIT",
              },
            ],
          });

          // mark winning settlement record completed
          await tx.settlementRecord.update({
            where: {
              id: settlementRecord.id,
            },
            data: {
              status: "COMPLETED",
              ledgerTransactionId: ledgerTransaction.id,
              settledAt: new Date(),
            },
          });
        } else {
          // losing position: no payout
          await tx.settlementRecord.update({
            where: {
              id: settlementRecord.id,
            },
            data: {
              status: "COMPLETED",
              settledAt: new Date(),
            },
          });
        }

        // close settled position
        await tx.position.update({
          where: {
            id: position.id,
          },
          data: {
            quantity: 0,
            lockedQuantity: 0,
          },
        });
      });
    }

    // complete settlement batch
    const completedBatch = await prisma.settlementBatch.update({
      where: {
        id: settlementBatch.id,
      },
      data: {
        status: "COMPLETED",
        totalWinningQuantity,
        totalPayoutAmount,
        completedAt: new Date(),
      },
    });

    // return settlement summary
    return {
      batchId: completedBatch.id,
      marketId,
      resolutionId: resolution.id,
      winningOutcome: resolution.outcome,
      totalWinningQuantity,
      totalPayoutAmount,
      winnersCount: winningPositions.length,
      losersCount: losingPositions.length,
      status: completedBatch.status,
      completedAt: completedBatch.completedAt,
    };
  } catch (error) {
    // mark batch failed so it can be recovered
    await prisma.settlementBatch.update({
      where: {
        id: settlementBatch.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
};
