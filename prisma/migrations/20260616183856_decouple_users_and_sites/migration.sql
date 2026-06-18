-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT IF EXISTS "Commission_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Coupon" DROP CONSTRAINT IF EXISTS "Coupon_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT IF EXISTS "PaymentTransaction_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_siteId_fkey";

-- DropForeignKey
ALTER TABLE "_SiteToUser" DROP CONSTRAINT IF EXISTS "_SiteToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_SiteToUser" DROP CONSTRAINT IF EXISTS "_SiteToUser_B_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "qrCodeUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "qrString" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "vaNumber" TEXT;

-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "paymentCode" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "qrCodeUrl" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "qrString" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "vaNumber" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "enabledCustomers" BOOLEAN DEFAULT false;

-- DropTable
DROP TABLE IF EXISTS "_SiteToUser";

-- CreateTable
CREATE TABLE "SiteUser" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteUser_siteId_idx" ON "SiteUser"("siteId");

-- CreateIndex
CREATE INDEX "SiteUser_userId_idx" ON "SiteUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_siteId_userId_key" ON "SiteUser"("siteId", "userId");

-- AddForeignKey
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
