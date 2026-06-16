# Runbook: SitusBisnis Operations

## Quick Reference

| Service       | Command                 | Description                             |
| ------------- | ----------------------- | --------------------------------------- |
| Dev Server    | `bun run dev`           | Start development server with Turbopack |
| Build         | `bun run build`         | Production build                        |
| Start         | `bun run start`         | Start production server                 |
| Lint          | `bun run lint`          | ESLint check                            |
| Typecheck     | `bun run typecheck`     | TypeScript check                        |
| Test Unit     | `bun run test:unit`     | Run unit tests                          |
| Test E2E      | `bun run test:e2e`      | Run E2E tests                           |
| DB Studio     | `bun run db:studio`     | Open Prisma Studio                      |
| DB Push       | `bun run db:push`       | Push schema to DB                       |
| Prisma Deploy | `bun run prisma:deploy` | Run migrations                          |

---

## Incident Response

### Site Not Loading (500 Error)

1. Check logs: `docker logs <container>` or platform logs
2. Check health: `curl https://<domain>/api/health`
3. Check database connectivity
4. Check Sentry for recent errors
5. If DB issue: `bun run prisma:deploy`

### Slow Performance

1. Check database query performance in Prisma Studio
2. Check cache hit rates
3. Review Sentry Performance tab
4. Check rate limiting logs for abuse

### Database Migration Failed

1. Check migration status: `bunx prisma migrate status`
2. Resolve conflicts manually
3. Re-run: `bun run prisma:deploy`
4. If stuck: `bunx prisma migrate resolve --rolled-back <migration-name>`

### Tenant Data Leak Suspected

1. Immediately audit all API queries for missing `siteId` scoping
2. Check Sentry for unauthorized access attempts
3. Review rate limiting logs
4. Audit database access logs

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass: `bun run test:unit && bun run test:e2e`
- [ ] Type check passes: `bun run typecheck`
- [ ] Lint passes: `bun run lint`
- [ ] Build succeeds locally: `bun run build`
- [ ] Database migrations ready
- [ ] Environment variables updated

### Deployment

- [ ] Push to `develop` (staging) or `main` (production)
- [ ] CI/CD pipeline passes
- [ ] Database migrations applied
- [ ] Health check returns 200
- [ ] Smoke test passes

### Post-Deployment

- [ ] Monitor Sentry for new errors
- [ ] Check application logs
- [ ] Verify key user flows
- [ ] Update documentation if needed

---

## Environment Variables

### Required

| Variable                  | Description                       | Example                   |
| ------------------------- | --------------------------------- | ------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string      | `postgresql://...`        |
| `NEXTAUTH_SECRET`         | JWT signing key (min 32 chars)    | `random-string-32-chars`  |
| `NEXTAUTH_URL`            | Auth callback URL                 | `https://app.example.com` |
| `NEXT_PUBLIC_APP_URL`     | Application URL                   | `https://app.example.com` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain for tenant resolution | `example.com`             |

### Optional

| Variable                 | Description                   | Default                      |
| ------------------------ | ----------------------------- | ---------------------------- |
| `R2_ACCOUNT_ID`          | Cloudflare R2 account ID      | -                            |
| `R2_ACCESS_KEY_ID`       | R2 access key                 | -                            |
| `R2_SECRET_ACCESS_KEY`   | R2 secret key                 | -                            |
| `R2_BUCKET_NAME`         | R2 bucket name                | -                            |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | -                            |
| `SENTRY_ORG`             | Sentry organization           | -                            |
| `SENTRY_PROJECT`         | Sentry project name           | -                            |
| `LOG_LEVEL`              | Logging level                 | `info` (prod), `debug` (dev) |

---

## Monitoring

### Health Check

```bash
curl https://<domain>/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-16T10:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "storage": "configured"
  }
}
```

### OpenAPI Documentation

```bash
curl https://<domain>/api/openapi
```

### Key Metrics to Monitor

- API response times (p50, p95, p99)
- Error rates by endpoint
- Database connection pool usage
- Rate limit hits
- Tenant resolution failures
