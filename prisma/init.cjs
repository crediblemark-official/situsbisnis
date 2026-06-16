/**
 * prisma/init.cjs
 *
 * Idempotent platform initialization — safe to run on every deploy.
 * - Upserts admin site (no update, preserves existing data)
 * - Creates admin user ONLY if the email does not exist yet (no password overwrite)
 *
 * Admin credentials are controlled via environment variables:
 *   ADMIN_EMAIL    (default: admin@situsbisnis.com)
 *   ADMIN_PASSWORD (required on first deploy, ignored once account exists)
 *
 * Plans are managed manually via the admin dashboard — not seeded here.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running platform initialization...');

  // ── 1. Upsert Admin Site ──────────────────────────────────────────────────
  const adminSite = await prisma.site.upsert({
    where: { subdomain: 'admin' },
    update: {}, // never overwrite existing site data
    create: {
      name: 'Platform Admin',
      subdomain: 'admin',
      description: 'Central Platform Administration',
    },
  });
  console.log('✅ Admin site ready.');

  // ── 2. Create Admin User (only if not already present) ───────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@situsbisnis.com';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`ℹ️  Admin account already exists: ${adminEmail} — skipping creation.`);
  } else {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.warn('⚠️  ADMIN_PASSWORD env var not set. Admin account will not be created.');
      console.warn('    Set ADMIN_PASSWORD to create the default admin on first deploy.');
    } else {
      const hashedPassword = await Bun.password.hash(adminPassword, {
        algorithm: 'bcrypt',
        cost: 12,
      });

      await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Platform Administrator',
          password: hashedPassword,
          role: 'admin',
          sites: { connect: { id: adminSite.id } },
        },
      });
      console.log(`✅ Admin account created: ${adminEmail}`);
    }
  }

  console.log('✨ Platform initialization complete.');
}

main()
  .catch((e) => {
    console.error('❌ Initialization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

