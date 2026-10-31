/*
  Warnings:

  - You are about to drop the column `bet` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `createrId` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `expiry` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `initialWager` on the `Market` table. All the data in the column will be lost.
  - The `resolution` column on the `Market` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Bet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `walletEvent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradingEndsAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradingStartsAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "MarketResolutionStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'SPLIT', 'MERGE', 'TRADE', 'SETTLEMENT');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('USER_AVAILABLE', 'USER_RESERVED', 'MARKET_COLLATERAL', 'CLEARING');

-- CreateEnum
CREATE TYPE "LedgerAccountStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "CollateralPoolStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'SETTLED');

-- CreateEnum
CREATE TYPE "SplitMergeOperationType" AS ENUM ('SPLIT', 'MERGE');

-- CreateEnum
CREATE TYPE "SplitMergeOperationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderAction" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "TimeInForce" AS ENUM ('GTC', 'IOC', 'FOK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderReservationType" AS ENUM ('CASH', 'CONTRACT');

-- CreateEnum
CREATE TYPE "OrderReservationStatus" AS ENUM ('ACTIVE', 'PARTIALLY_RELEASED', 'RELEASED');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('EXECUTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "SettlementBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettlementRecordStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_markedId_fkey";

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_userId_fkey";

-- DropForeignKey
ALTER TABLE "Market" DROP CONSTRAINT "Market_createrId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Market" DROP COLUMN "bet",
DROP COLUMN "createrId",
DROP COLUMN "expiry",
DROP COLUMN "initialWager",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maxPrice" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "minOrderQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "minPrice" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "payoutPerContract" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "status" "MarketStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tickSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalPairsBurned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPairsCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tradingEndsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tradingStartsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "resolution",
ADD COLUMN     "resolution" "ResolutionType";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "balance",
DROP COLUMN "email",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "Bet";

-- DropTable
DROP TABLE "walletEvent";

-- DropEnum
DROP TYPE "BetType";

-- CreateTable
CREATE TABLE "MarketResolution" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "resolvedBy" TEXT NOT NULL,
    "outcome" "ResolutionType" NOT NULL,
    "resolutionSource" TEXT,
    "status" "MarketResolutionStatus" NOT NULL DEFAULT 'PROPOSED',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availableBalance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "provider" TEXT,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "provider" TEXT,
    "providerTransactionId" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "walletId" TEXT,
    "marketId" TEXT,
    "accountType" "LedgerAccountType" NOT NULL,
    "status" "LedgerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "referenceType" "LedgerTransactionType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "LedgerTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "direction" "LedgerEntryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" "OutcomeType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lockedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollateralPool" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "lockedAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "CollateralPoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollateralPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitMergeOperation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "operationType" "SplitMergeOperationType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "collateralAmount" INTEGER NOT NULL,
    "status" "SplitMergeOperationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SplitMergeOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" "OutcomeType" NOT NULL,
    "action" "OrderAction" NOT NULL,
    "timeInForce" "TimeInForce" NOT NULL DEFAULT 'GTC',
    "price" INTEGER NOT NULL,
    "originalQuantity" INTEGER NOT NULL,
    "filledQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "sequence" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "walletId" TEXT,
    "positionId" TEXT,
    "reservationType" "OrderReservationType" NOT NULL,
    "reservedAmount" INTEGER,
    "reservedQuantity" INTEGER,
    "releasedAmount" INTEGER NOT NULL DEFAULT 0,
    "releasedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" "OutcomeType" NOT NULL,
    "makerOrderId" TEXT NOT NULL,
    "takerOrderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "executionPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'EXECUTED',
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementBatch" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "resolutionId" TEXT NOT NULL,
    "status" "SettlementBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalWinningQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalPayoutAmount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "ledgerTransactionId" TEXT,
    "outcome" "OutcomeType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "payoutPerContract" INTEGER NOT NULL,
    "payoutAmount" INTEGER NOT NULL,
    "status" "SettlementRecordStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketResolution_marketId_status_idx" ON "MarketResolution"("marketId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_providerOrderId_key" ON "Deposit"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_providerPaymentId_key" ON "Deposit"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Deposit_walletId_status_idx" ON "Deposit"("walletId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_providerTransactionId_key" ON "Withdrawal"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Withdrawal_walletId_status_idx" ON "Withdrawal"("walletId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_walletId_accountType_key" ON "LedgerAccount"("walletId", "accountType");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_marketId_accountType_key" ON "LedgerAccount"("marketId", "accountType");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_idempotencyKey_key" ON "LedgerTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_createdAt_idx" ON "LedgerEntry"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "Position_marketId_outcome_idx" ON "Position"("marketId", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_marketId_outcome_key" ON "Position"("userId", "marketId", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "CollateralPool_marketId_key" ON "CollateralPool"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitMergeOperation_ledgerTransactionId_key" ON "SplitMergeOperation"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "SplitMergeOperation_marketId_createdAt_idx" ON "SplitMergeOperation"("marketId", "createdAt");

-- CreateIndex
CREATE INDEX "SplitMergeOperation_userId_createdAt_idx" ON "SplitMergeOperation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_sequence_key" ON "Order"("sequence");

-- CreateIndex
CREATE INDEX "Order_marketId_outcome_action_status_price_sequence_idx" ON "Order"("marketId", "outcome", "action", "status", "price", "sequence");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "OrderReservation_orderId_status_idx" ON "OrderReservation"("orderId", "status");

-- CreateIndex
CREATE INDEX "Trade_marketId_outcome_executedAt_idx" ON "Trade"("marketId", "outcome", "executedAt");

-- CreateIndex
CREATE INDEX "Trade_buyerId_executedAt_idx" ON "Trade"("buyerId", "executedAt");

-- CreateIndex
CREATE INDEX "Trade_sellerId_executedAt_idx" ON "Trade"("sellerId", "executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementBatch_resolutionId_key" ON "SettlementBatch"("resolutionId");

-- CreateIndex
CREATE INDEX "SettlementBatch_marketId_idx" ON "SettlementBatch"("marketId");

-- CreateIndex
CREATE INDEX "SettlementRecord_status_idx" ON "SettlementRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementRecord_batchId_positionId_key" ON "SettlementRecord"("batchId", "positionId");

-- CreateIndex
CREATE INDEX "Market_status_tradingStartsAt_tradingEndsAt_idx" ON "Market"("status", "tradingStartsAt", "tradingEndsAt");

-- CreateIndex
CREATE INDEX "Market_creatorId_idx" ON "Market"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketResolution" ADD CONSTRAINT "MarketResolution_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketResolution" ADD CONSTRAINT "MarketResolution_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollateralPool" ADD CONSTRAINT "CollateralPool_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitMergeOperation" ADD CONSTRAINT "SplitMergeOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitMergeOperation" ADD CONSTRAINT "SplitMergeOperation_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitMergeOperation" ADD CONSTRAINT "SplitMergeOperation_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReservation" ADD CONSTRAINT "OrderReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReservation" ADD CONSTRAINT "OrderReservation_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReservation" ADD CONSTRAINT "OrderReservation_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_makerOrderId_fkey" FOREIGN KEY ("makerOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_takerOrderId_fkey" FOREIGN KEY ("takerOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementBatch" ADD CONSTRAINT "SettlementBatch_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementBatch" ADD CONSTRAINT "SettlementBatch_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "MarketResolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SettlementBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
