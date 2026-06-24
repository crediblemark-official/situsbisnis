/*
  Warnings:

  - You are about to drop the `_CredBuildPageToTerm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductToTerm` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CredBuildPage" DROP CONSTRAINT "CredBuildPage_siteId_fkey";

-- DropForeignKey
ALTER TABLE "GalleryItem" DROP CONSTRAINT "GalleryItem_siteId_fkey";

-- DropForeignKey
ALTER TABLE "MediaFolder" DROP CONSTRAINT "MediaFolder_siteId_fkey";

-- DropForeignKey
ALTER TABLE "MediaItem" DROP CONSTRAINT "MediaItem_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_siteId_fkey";

-- DropForeignKey
ALTER TABLE "MetaData" DROP CONSTRAINT "MetaData_pageId_fkey";

-- DropForeignKey
ALTER TABLE "MetaData" DROP CONSTRAINT "MetaData_productId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_siteId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_couponId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_planId_fkey";

-- DropForeignKey
ALTER TABLE "PortfolioItem" DROP CONSTRAINT "PortfolioItem_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SeoMeta" DROP CONSTRAINT "SeoMeta_pageId_fkey";

-- DropForeignKey
ALTER TABLE "SeoMeta" DROP CONSTRAINT "SeoMeta_productId_fkey";

-- DropForeignKey
ALTER TABLE "SiteUser" DROP CONSTRAINT "SiteUser_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Taxonomy" DROP CONSTRAINT "Taxonomy_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Testimonial" DROP CONSTRAINT "Testimonial_siteId_fkey";

-- DropForeignKey
ALTER TABLE "_CredBuildPageToTerm" DROP CONSTRAINT "_CredBuildPageToTerm_A_fkey";

-- DropForeignKey
ALTER TABLE "_CredBuildPageToTerm" DROP CONSTRAINT "_CredBuildPageToTerm_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToTerm" DROP CONSTRAINT "_ProductToTerm_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToTerm" DROP CONSTRAINT "_ProductToTerm_B_fkey";

-- AlterTable
ALTER TABLE "Commission" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "PaymentSettings" ADD COLUMN     "gatewayEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manualEnabled" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "paymentGateway" SET DEFAULT 'midtrans';

-- AlterTable
ALTER TABLE "PaymentTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "price" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "priceYearly" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "originalPrice" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "originalPriceYearly" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "paymentGateway" SET DEFAULT 'midtrans';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "originalPrice" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "affiliateBalance" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Withdrawal" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2);

-- DropTable
DROP TABLE "_CredBuildPageToTerm";

-- DropTable
DROP TABLE "_ProductToTerm";

-- CreateIndex
CREATE INDEX "CredBuildPage_siteId_idx" ON "CredBuildPage"("siteId");

-- CreateIndex
CREATE INDEX "Post_siteId_idx" ON "Post"("siteId");

-- CreateIndex
CREATE INDEX "Product_siteId_idx" ON "Product"("siteId");
