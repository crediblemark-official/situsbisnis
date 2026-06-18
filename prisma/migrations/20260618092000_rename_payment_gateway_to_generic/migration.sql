-- AlterTable
-- Gunakan blok PL/pgSQL untuk menangani migrasi secara kondisional agar aman baik untuk DB yang sudah di-db-push maupun belum.
DO $$
BEGIN
    -- 1. Penanganan untuk PaymentSettings
    -- Tambah kolom baru jika belum ada
    ALTER TABLE "PaymentSettings" ADD COLUMN IF NOT EXISTS "paymentGateway" TEXT DEFAULT 'duitku';
    ALTER TABLE "PaymentSettings" ADD COLUMN IF NOT EXISTS "gatewayMerchantId" TEXT;
    ALTER TABLE "PaymentSettings" ADD COLUMN IF NOT EXISTS "gatewayApiKey" TEXT;
    ALTER TABLE "PaymentSettings" ADD COLUMN IF NOT EXISTS "gatewayClientKey" TEXT;
    ALTER TABLE "PaymentSettings" ADD COLUMN IF NOT EXISTS "gatewaySandbox" BOOLEAN NOT NULL DEFAULT true;

    -- Salin data lama ke kolom baru dan hapus kolom lama hanya jika kolom lama ada
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PaymentSettings' AND column_name='duitkuMerchantCode') THEN
        UPDATE "PaymentSettings"
        SET "gatewayMerchantId" = "duitkuMerchantCode",
            "gatewayApiKey" = "duitkuApiKey",
            "gatewaySandbox" = "duitkuSandbox";
            
        ALTER TABLE "PaymentSettings" DROP COLUMN "duitkuMerchantCode";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PaymentSettings' AND column_name='duitkuApiKey') THEN
        ALTER TABLE "PaymentSettings" DROP COLUMN "duitkuApiKey";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PaymentSettings' AND column_name='duitkuSandbox') THEN
        ALTER TABLE "PaymentSettings" DROP COLUMN "duitkuSandbox";
    END IF;

    -- 2. Penanganan untuk PlatformSettings
    -- Tambah kolom baru jika belum ada
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayMerchantId" TEXT;
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayClientKey" TEXT;
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayApiKey" TEXT;
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewaySandbox" BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayApiType" TEXT DEFAULT 'snap';

    -- Salin data dari midtrans/duitku ke kolom generic jika kolom lama ada
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='duitkuMerchantCode') THEN
        UPDATE "PlatformSettings"
        SET "gatewayMerchantId" = CASE WHEN "paymentGateway" = 'midtrans' THEN "midtransMerchantId" ELSE "duitkuMerchantCode" END,
            "gatewayClientKey" = CASE WHEN "paymentGateway" = 'midtrans' THEN "midtransClientKey" ELSE NULL END,
            "gatewayApiKey" = CASE WHEN "paymentGateway" = 'midtrans' THEN "midtransServerKey" ELSE "duitkuApiKey" END,
            "gatewaySandbox" = CASE WHEN "paymentGateway" = 'midtrans' THEN "midtransSandbox" ELSE "duitkuSandbox" END,
            "gatewayApiType" = CASE WHEN "paymentGateway" = 'midtrans' THEN "midtransApiType" ELSE 'snap' END;
            
        ALTER TABLE "PlatformSettings" DROP COLUMN "duitkuMerchantCode";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='duitkuApiKey') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "duitkuApiKey";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='duitkuSandbox') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "duitkuSandbox";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='midtransMerchantId') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "midtransMerchantId";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='midtransClientKey') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "midtransClientKey";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='midtransServerKey') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "midtransServerKey";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='midtransSandbox') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "midtransSandbox";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformSettings' AND column_name='midtransApiType') THEN
        ALTER TABLE "PlatformSettings" DROP COLUMN "midtransApiType";
    END IF;
END $$;
