# SitusBisnis Deployment Guide on Dokploy (Migration from Vercel)

This document provides step-by-step technical guidance for migrating **SitusBisnis (Next.js App Router)** from **Vercel** to **Dokploy PaaS** on your own VPS.

By co-locating the application container (Dokploy) and PostgreSQL database on the same VPS (or private VPS network), you gain **microsecond latency performance** and **eliminate monthly Vercel fees**.

---

## 1. Architecture Comparison: Vercel vs Dokploy + PostgreSQL

| Feature                    | Legacy Architecture (Vercel + Remote DB)                                                                                    | New Architecture (Dokploy + PostgreSQL on Same VPS)                                                                                                                                                   |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Network Latency**        | **High (50ms - 150ms)**: Vercel serverless runs in AWS regions, database is separate.                                      | **Very Low (0.1ms - 1ms)**: Application and database containers share the same VPS.                                                                                                                   |
| **DB Connection Load**     | **High (Connection Exhaustion)**: Each Vercel serverless invocation opens a new connection, potentially overwhelming the DB. | **Very Stable (Connection Pool Stable)**: Next.js runs as a long-running Node.js process. Prisma connection pool is managed internally (~10 connections default).                                     |
| **Multi-Tenant Routing**   | Managed through Vercel domain configuration and paid/limited wildcard SSL.                                                  | Managed automatically and free through **Traefik Reverse Proxy** (built into Dokploy) with Let's Encrypt SSL.                                                                                         |
| **Operational Cost**       | Potentially increases with traffic and Vercel serverless bandwidth.                                                         | **Flat & Free** (Only VPS monthly rental cost).                                                                                                                                                       |

---

## 2. Dockerfile Setup & Monorepo Configuration in Dokploy

SitusBisnis uses a monorepo architecture (with external modules like `@crediblemark/buayar`, `@crediblemark/build-ui`, etc., located in the parent `../` directory).

Dokploy _by default_ looks for `Dockerfile` in the repository root. To ensure the build correctly detects sibling dependencies, configure as follows when creating the app in the Dokploy panel:

### App Setup Steps in Dokploy UI:

1. Log in to your Dokploy dashboard.
2. Click **`Create Application`** → Select **`Github`** or **`Git`** (connect to your SitusBisnis repository).
3. Fill in basic Git configuration (Repository, Branch `main` / `production`).
4. **IMPORTANT - Build Path & Dockerfile Configuration**:
   - **Root Directory / Context Path \***: Enter `/` (Indicates monorepo root, not a subfolder). This is crucial for the Next.js compiler to trace folders outside `SitusBisnis` (`outputFileTracingRoot`).
   - **Dockerfile Path \***: Enter `SitusBisnis/Dockerfile` (Points directly to the Dockerfile inside the `SitusBisnis` subfolder).

---

## 3. Environment Variables Configuration in Dokploy

Since your application runs as a long-running process in Node.js/Bun, you can connect directly to the main PostgreSQL port (`5432`) for maximum performance without external connection pooler overhead.

Open the **`Environment`** tab in your Dokploy application, then add the following environment variables:

### Core Variables:

```env
# Direct connection to main PostgreSQL
DATABASE_URL="postgresql://<db_user>:<db_password>@168.231.119.22:5432/situsbisnis?schema=public&connection_limit=10"

# SaaS URL & Main Domain Credentials
NEXT_PUBLIC_APP_URL="https://situsbisnis.com"
NEXTAUTH_URL="https://situsbisnis.com"

# Authentication & Multi-Tenant Cookie Settings (CRITICAL for subdomain sharing!)
NEXTAUTH_SECRET="enter_a_long_random_and_very_secure_string"
NEXTAUTH_COOKIE_DOMAIN=".situsbisnis.com"

# Disable Telemetry for container performance
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
PORT=3000
```

> [!TIP]
>
> - **`connection_limit=10`**: In Dokploy, the Next.js app runs as a _long-running process_. Prisma ORM maintains a stable maximum of 10 connections. This is very safe and fast since it avoids repeated database connection handshake overhead common in serverless environments.
> - If your PostgreSQL database is on the same internal Docker Bridge network as Dokploy, you can use the Docker internal gateway IP (e.g., `172.17.0.1:5432`) to enhance network security (without exposing the DB port to the internet).

---

## 4. Wildcard Domain Configuration for Multi-Tenant (Traefik)

The **SitusBisnis** platform supports dynamic multi-tenant subdomains (e.g., `tenantA.situsbisnis.com`, `tenantB.situsbisnis.com`). Dokploy uses **Traefik Reverse Proxy**, which handles this excellently.

### Steps to Configure Domains in Dokploy:

1. Open your application in Dokploy → Go to the **`Domains`** tab.
2. **Add Main SaaS Domain**:
   - Domain: `situsbisnis.com`
   - Port: `3000`
   - Certs: Check **Let's Encrypt SSL** for automatic free HTTPS.
3. **Add Wildcard Domain for Tenants**:
   - Domain: `*.situsbisnis.com`
   - Port: `3000`
   - Certs: For wildcard domains, you need DNS verification (DNS-01 Challenge).
     - _Practical Alternative_: If you use **Cloudflare** for DNS, configure the DNS-01 Challenge in Traefik's Dokploy settings using your Cloudflare API Token so Let's Encrypt SSL certificates for `*.situsbisnis.com` can be issued automatically.

---

## 5. Database Migration Automation During Deployment

In the [Dockerfile](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis/Dockerfile), the final launch command is configured as:

```dockerfile
CMD ["sh", "-c", "bunx prisma migrate deploy && bun server.js"]
```

This means every time Dokploy finishes building the image and launches a new container:

1. The system automatically runs `prisma migrate deploy` first to safely apply new database schema migrations (without deleting existing data).
2. After migration succeeds, the new Next.js server starts on port `3000`.
3. This process ensures the database schema and application version are always in sync with zero downtime during updates.

---

## 6. Health Check Configuration for Zero-Downtime

To ensure smooth redeployment without interrupting active users (Zero-Downtime Rolling Update), enable **Health Check** in the Dokploy panel:

1. In your Dokploy application tab, find the **`Health Check`** menu.
2. Configure the following:
   - **Path**: `/api/health` (Application & database health monitoring endpoint).
   - **Port**: `3000`
   - **Interval**: `10s` (Check every 10 seconds).
   - **Timeout**: `5s`
   - **Retries**: `3`
3. Traefik in Dokploy will NOT route user traffic to the new application container until the `/api/health` endpoint returns HTTP 200. The old container continues serving users until the new one is fully ready.

---

## 7. Final Migration Steps from Vercel

1. **First Deploy on Dokploy**: Click the **`Deploy`** button in your Dokploy dashboard. Wait for the bun dependency installation and Next.js standalone build to complete.
2. **Verify Logs**: Check the **`Logs`** tab in Dokploy to ensure `prisma migrate deploy` runs successfully and the server starts listening on port `3000`.
3. **Test Domain**: Visit the temporary Dokploy domain or your main domain to verify the SitusBisnis dashboard and multi-tenant panel respond quickly.
4. **Update DNS**: Change your main domain and wildcard `A` (or `CNAME`) records in Cloudflare/DNS Provider from pointing to Vercel to pointing to your Dokploy VPS IP (`168.231.119.22`).
5. **Deactivate Vercel Deployment**: After DNS propagation is complete (~1-2 hours) and traffic fully enters your Dokploy VPS, you can safely deactivate the project on Vercel.

---

## 8. Automatic SSL Handling & Routing for Custom Tenant Domains

In a self-managed VPS architecture (Dokploy + Traefik), when a tenant registers their own third-party custom domain (e.g., `tokoindonesia.com`), HTTP/S traffic must be routed to your Next.js application container and obtain **Let's Encrypt SSL** certificates automatically.

Here are the 2 best options to automate this process:

### Option A: Dynamic Registration via Dokploy API (Primary Recommendation)

Dokploy provides an internal GraphQL API for manipulating application settings, including dynamic custom domain addition.

1. Whenever a domain is successfully verified in the backend (`DomainService.verifyDomain`), trigger an API Call to the Dokploy API endpoint using your administrative token.
2. The Dokploy API automatically registers the `tokoindonesia.com` domain to your application, and Traefik immediately issues a Let's Encrypt SSL certificate without manual intervention.

### Option B: Additional Reverse Proxy with On-Demand TLS (Caddy Edge)

If you want to bypass per-application domain configuration limitations in Dokploy:

1. Place **Caddy** as an edge reverse proxy on ports `80` and `443` in front of Docker/Dokploy.
2. Caddy has a legendary built-in **On-Demand TLS** feature. When a visitor accesses `tokoindonesia.com`, Caddy dynamically detects the new domain, queries the SitusBisnis backend (`/api/domains/check`) to validate it, and instantly issues a Let's Encrypt SSL certificate in milliseconds during the TLS handshake.
