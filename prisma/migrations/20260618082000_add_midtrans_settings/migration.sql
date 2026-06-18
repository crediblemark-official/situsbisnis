-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "paymentGateway" TEXT DEFAULT 'duitku';
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "midtransMerchantId" TEXT;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "midtransClientKey" TEXT;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "midtransServerKey" TEXT;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "midtransSandbox" BOOLEAN DEFAULT true;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "midtransApiType" TEXT DEFAULT 'snap';
