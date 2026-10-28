/*
  Warnings:

  - You are about to drop the column `initialWaeger` on the `Market` table. All the data in the column will be lost.
  - Added the required column `initialWager` to the `Market` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "initialWaeger",
ADD COLUMN     "initialWager" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_createrId_fkey" FOREIGN KEY ("createrId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
