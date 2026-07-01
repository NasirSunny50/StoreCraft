-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "warranty" TEXT;
