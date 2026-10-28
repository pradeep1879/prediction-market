/*
  Warnings:

  - The `resolution` column on the `Market` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "resolution",
ADD COLUMN     "resolution" "BetType" NOT NULL DEFAULT 'NO';
