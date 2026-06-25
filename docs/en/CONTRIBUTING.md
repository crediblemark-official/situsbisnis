# Contributing to SitusBisnis

Thank you for your interest in contributing to SitusBisnis! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct.

## Getting Started

### Prerequisites

- **Node.js** 20+ or **Bun** 1.3+
- **PostgreSQL** 16+
- **Git**

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/situsbisnis.git`
3. Install dependencies: `bun install`
4. Copy `.env.example` to `.env.local` and fill in required values
5. Set up the database: `bun run db:push`
6. Start the development server: `bun run dev`

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions or changes

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:

```
feat(auth): add OAuth login support
fix(api): resolve pagination off-by-one error
docs(readme): update installation instructions
```

### Pull Requests

1. Update your branch with the latest main
2. Run all checks locally:
   ```bash
   bun run typecheck
   bun run lint
   bun run test:unit
   bun run build
   ```
3. Create a Pull Request using the template
4. Request review from code owners
5. Address review feedback

## Testing

### Unit Tests

```bash
bun run test:unit          # Run tests
bun run test:coverage      # Run with coverage report
bun run test:ui            # Run with Vitest UI
```

### E2E Tests

```bash
bun run test:e2e           # Run Playwright tests
```

### Writing Tests

- Unit tests go in `tests/unit/`
- E2E tests go in `tests/e2e/`
- Test files should be named `*.test.ts`
- Follow existing test patterns
- Aim for high coverage of business logic

## Code Style

- TypeScript strict mode enabled
- ESLint with Next.js core-web-vitals + jsx-a11y
- Prettier for formatting (if configured)
- Follow existing patterns and conventions

### Key Conventions

- Use `async/await` over promises
- Prefer server components unless client interactivity needed
- Use `cache()` and `unstable_cache()` for data fetching
- Validate all inputs with Zod
- Use structured logging via `createLogger(moduleName)`
- Handle errors with `AppError` class

## Security

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate all user inputs
- Follow OWASP guidelines
- Report security vulnerabilities privately

## Documentation

- Update documentation for user-facing changes
- Add JSDoc comments for public APIs
- Update ADRs for architectural changes
- Keep README and runbooks up to date

## Review Process

1. **Automated Checks**: CI must pass (lint, typecheck, tests, build)
2. **Code Review**: At least one approval from code owner
3. **Testing**: Changes should be tested
4. **Documentation**: Updated if needed

## Questions?

- Open a [Discussion](https://github.com/crediblemark-official/situsbisnis/discussions)
- Contact the team at support@SitusBisnis.id

## Project Board

Whenever you complete a new feature or bug fix that is merged into this repository, you are **REQUIRED** to update the GitHub Project Board ([Situs Bisnis Roadmap](https://github.com/orgs/crediblemark-official/projects/1)).

1. Add a new ticket item to the board (if it doesn't exist yet).
2. Update the status of the item to **Done**.
3. The `/roadmap` page in the app will automatically sync with this project board.
