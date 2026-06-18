# Deployment Guide

1001-Web is optimized for modern cloud deployments.

## Vercel (Highly Recommended)

Vercel is the best platform for 1001-Web due to its seamless Next.js support.

### Platform Constraints

- **Read-only Filesystem**: 1001-Web detects this and uses environment variables instead of writing to `.env`.
- **Serverless Functions**: Ensure your DB provider supports serverless connections (e.g., Neon via WebSocket).

### Setup Steps

1.  **Repository**: Connect your GitHub repository to Vercel.
2.  **Environment Variables**:
    - `DATABASE_URL`: Your PostgreSQL connection string.
    - `NEXT_PUBLIC_APP_URL`: Your deployment URL (e.g., `https://my-site.vercel.app`).
    - `NEXTAUTH_URL`: Same as above.
    - `NEXTAUTH_SECRET`: Generate a random string (or let the installer attempt it).
    - `R2_*` variables: Required for image uploads.
3.  **Deploy**: Trigger the deployment.
4.  **Install**: Navigate to `https://your-site.com/installer` to complete the DB seeding.

---

## Railway / Docker / VPS

For persistent environments where you have a writable filesystem.

### Persistent Config

1.  Run the application.
2.  The installer will save your configuration directly to a `.env` file.
3.  Restarting the server will pick up the new variables automatically.

---

## Recommended Database Providers

- **Neon** (Postgres): Best for Vercel (Serverless-friendly).
- **Supabase** (Postgres): Reliable and feature-rich.
- **Railway/PlanetScale**: Great alternatives.

---

## Troubleshooting

### "Application already installed"

If you see this error, it means an Admin user already exists in your database. If you need to re-install, you must manually delete the `User` records in your database or point to a fresh database.

### Link Mismatch (SEO)

Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain to avoid sitemap or canonical link issues.
