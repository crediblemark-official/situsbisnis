# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SitusBisnis seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@SitusBisnis.id**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### Please include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Preferred Languages

We prefer all communications to be in English or Indonesian.

### Response Process

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Verification**: Our team will verify the vulnerability and assess its impact
3. **Fix Development**: We will develop and test a fix
4. **Disclosure**: We will coordinate public disclosure with you

### Bug Bounty

We currently do not offer a bug bounty program. However, we greatly appreciate responsible disclosure and will credit reporters in our security advisories.

## Security Best Practices

### For Developers

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas
3. **Use parameterized queries** - Prisma handles this automatically
4. **Keep dependencies updated** - Run `bun audit` regularly
5. **Follow the principle of least privilege** - Limit access rights

### For Users

1. **Use strong passwords** - Minimum 8 characters, mix of types
2. **Enable 2FA** - When available
3. **Keep your browser updated** - Use latest versions
4. **Report suspicious activity** - Contact support immediately

## Security Features

- ✅ HTTPS enforcement in production
- ✅ HTTP Security Headers (HSTS, X-Frame-Options, CSP, etc.)
- ✅ bcrypt password hashing
- ✅ JWT with secure cookies
- ✅ Rate limiting on API endpoints
- ✅ Role-based access control
- ✅ Site isolation for multi-tenant data
- ✅ Input validation with Zod
- ✅ SQL injection prevention via Prisma ORM
- ✅ XSS protection headers
- ✅ CSRF protection via NextAuth

## Audit History

| Date       | Type                     | Result                     |
| ---------- | ------------------------ | -------------------------- |
| 2026-05-16 | Internal Security Review | Passed                     |
| 2026-05-16 | Dependency Audit         | 0 critical vulnerabilities |
