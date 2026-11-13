-- AlterTable
ALTER TABLE "MarketResolution" ADD COLUMN     "confirmedBy" TEXT;

-- AddForeignKey
ALTER TABLE "MarketResolution" ADD CONSTRAINT "MarketResolution_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
