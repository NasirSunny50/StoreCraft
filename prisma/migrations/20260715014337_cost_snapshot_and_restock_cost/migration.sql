-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "cost" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StockLog" ADD COLUMN     "unitCost" DECIMAL(12,2);
