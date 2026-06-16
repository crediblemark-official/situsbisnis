#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Running database migrations (Prisma)..."
bunx prisma migrate deploy

echo "🚀 Running platform initialization (Admin account check)..."
bun prisma/init.cjs

echo "🚀 Starting Next.js application server..."
# Using exec ensures that Bun receives system OS signals (SIGTERM/SIGINT) directly for graceful shutdown.
exec bun server.js
