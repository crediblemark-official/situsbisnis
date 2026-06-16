# Installation Guide

1001-Web features a **Universal Adaptive Installer** that simplifies setup across different environments.

## 1. Local Development (Recommended for Customization)

### Step 1: Clone & Install

```bash
git clone https://github.com/crediblemark-official/situsbisnis.git
cd situsbisnis
bun install
```

### Step 2: Database Setup

Ensure you have a PostgreSQL database running. You can use Docker or a local installation.

```bash
npx prisma db push
```

### Step 3: Run Installer

Start the development server:

```bash
bun dev
```

Navigate to `http://localhost:3000/installer`. The UI will guide you through:

1.  **Infrastructure Config**: Automatically detects your `.env` capabilities.
2.  **Site Identity**: Set your site name and description.
3.  **Admin Account**: Create the root administrator.

---

## 2. Cloud Installation (Vercel / Railway)

On cloud platforms, the file system is usually **read-only**. 1001-Web handles this by detecting system environment variables.

### Step 1: Environment Variables

Before running the installer, set these keys in your provider's dashboard:

- `DATABASE_URL` (Required)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN` (Highly recommended for media)
- `NEXT_PUBLIC_APP_URL` & `NEXTAUTH_URL` (Set to your domain)

### Step 2: Push & Deploy

Push the code to your repository. Once deployed, navigate to `https://your-domain.com/installer`.

### Step 3: Adaptive Detection

The installer will show a badge **"System Env Detected"**. You can skip the configuration form and proceed directly to creating your Admin account.

---

## 3. Storage Configuration (Cloudflare R2)

1001-Web uses Cloudflare R2 for reliable media storage.

1.  Create an R2 bucket in Cloudflare.
2.  Assign a "Public Domain" or "R2.dev Subdomain" to the bucket.
3.  Generate an API Token (Edit permissions) and note the Access Key and Secret Key.
4.  Input these into the installer.
