# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Structured logging with Pino (`lib/core/logger.ts`)
- API rate limiting via middleware (`lib/core/rate-limit.ts`)
- Health check endpoint (`/api/health`)
- Sentry error monitoring integration
- OpenAPI/Swagger documentation (`/api/openapi`)
- Accessibility testing with axe-core
- ESLint jsx-a11y plugin for accessibility rules
- Husky pre-commit hooks with lint-staged
- Docker Compose with PostgreSQL for local development
- `.env.example` template
- CODEOWNERS file for code review automation
- CONTRIBUTING.md guide
- SECURITY.md for vulnerability reporting
- Architecture Decision Records (ADR)
- Operations Runbook
- PR and Issue templates
- Coverage thresholds in vitest config (70% lines/functions/statements)
- Database migration automation in CI/CD
- API versioning documentation

### Changed
- Fixed 15 TypeScript errors in credbuild.config.tsx
- Fixed 49 ESLint warnings (unused imports)
- Removed `ignoreBuildErrors` from next.config.js
- Tightened environment validation (fail fast in production)
- Integrated rate limiting into proxy.ts middleware
- Replaced `console.error` with structured logging in CRUD handler
- Enhanced error boundary with Sentry integration
- Updated ESLint config with jsx-a11y rules
- Improved Docker Compose with health checks and networking

### Fixed
- TypeScript compilation errors (0 errors now)
- ESLint warnings for unused imports
- Rate limiter Map iteration issue
- Environment validation error messages
- A11y label associations in auth pages

### Security
- Added API rate limiting (100 req/15min default, 20 req/15min for auth)
- Added structured logging for audit trails
- Added environment variable validation with strict requirements
- Added security headers to all responses
- Added Sentry for real-time error monitoring

## [1.0.0] - 2026-05-16

### Initial Release
- Multi-tenant CMS with subdomain routing
- Visual page builder with 40+ components
- Next.js 16 App Router with React 19
- Prisma ORM with PostgreSQL
- NextAuth.js authentication
- Role-based access control (admin, owner, editor, user)
- E-commerce support (products, cart, orders)
- Media library with R2/S3 storage
- Rich text editor (Tiptap)
- Dashboard with settings management
- Subscription billing system
- Custom domain support with DNS verification
- Unit tests (Vitest) + E2E tests (Playwright)
- CI/CD pipeline with GitHub Actions
- Docker deployment support
