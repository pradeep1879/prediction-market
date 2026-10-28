-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "initialWaeger" INTEGER NOT NULL,
    "bet" "BetType" NOT NULL,
    "createrId" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "resolution" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "markedId" TEXT NOT NULL,
    "betAmount" INTEGER NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "walletEvent" (
    "id" TEXT NOT NULL,
    "tx_type" TEXT NOT NULL,
    "externalId" JSONB NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "walletEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_markedId_fkey" FOREIGN KEY ("markedId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
