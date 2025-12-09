# Copilot Instructions for Simul

## Project Overview

**Simul** is a Next.js-based educational coding practice platform. It allows instructors to create coding challenges and record/playback student coding sessions with CodeMirror integration. The codebase uses TypeScript, React 19, Tailwind CSS, shadcn/ui, PostgreSQL with Drizzle ORM, and Playwright for E2E testing.

## Tech Stack & Versions

- **Next.js**: 15.5.4 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4 + shadcn/ui (New York style)
- **Database**: PostgreSQL with Drizzle ORM
- **Code Editor**: CodeMirror 6 (@uiw/react-codemirror)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Package Manager**: pnpm (v8+)
- **Build Tool**: Turbopack
- **Environment**: Nix dev shell (optional; manual setup also supported)

## Critical Setup & Build Information

### Development

- **Start dev server**: `pnpm dev` (includes database via Docker Compose)
- **Dev server only**: `pnpm next dev --turbopack` (no database)
- **Build**: `pnpm build` (requires `DATABASE_URL` and auth secrets in `.env`)

### Database

- **Push schema changes**: `pnpm db:push`
- **Open GUI**: `pnpm db:studio`
- **Docker Compose**: `docker-compose.yml` in root starts PostgreSQL automatically with `pnpm dev`

### Testing

- **Unit tests**: `pnpm test -- --run` (Vitest)
- **E2E tests**: First run `pnpm exec playwright install`, then `pnpm test:e2e`
- **Linting**: `pnpm lint` (ESLint)
- **Nix formatting**: `nix develop -c alejandra --check .` (if modifying `.nix` files)

All tests and linting run in Nix shells in CI. Locally, you can run them directly if dependencies are installed.

### Environment Variables

Required `.env` file (copy from `.env.example`):

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simul_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
POSTGRES_DB=simul_db
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
GH_CLIENT_ID=<from GitHub OAuth>
GH_SECRET=<from GitHub OAuth>
```

**Never** access `process.env` directly in code. Use the validated env:

```typescript
import { serverEnv } from "~/lib/env";
const dbUrl = serverEnv.DATABASE_URL;
```

## Project Layout & Architecture

### Root Configuration Files

- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint rules (pre-commit hook validates)
- `next.config.ts` - Next.js config
- `vitest.config.ts` / `vitest.setup.ts` - Unit test setup
- `playwright.config.ts` - E2E test config
- `drizzle.config.ts` - Database migration config
- `docker-compose.yml` - PostgreSQL container
- `flake.nix` / `flake.lock` - Nix environment

### Documentation

- `docs/actions.md` - Server action patterns
- `docs/authentication.md` - OAuth setup & Better Auth config
- `docs/component-styling-guide.md` - Tailwind & shadcn/ui theming
- `docs/testing.md` - Test writing guide

## Import Alias & Code Style

- Use `~/*` for imports from `src/` (e.g., `import { db } from "~/lib/db"`)
- Use Tailwind CSS for styling; use shadcn/ui components when available, and install new ones as needed
- Validate all server inputs with Zod and `actionClient` from `next-safe-action`
- Use Drizzle for all database queries; connection: `import { db } from "~/lib/db"`
- Dark mode support via `next-themes`; always test both themes

## Dependencies & Key Libraries

- **Authentication**: Better Auth (Next.js integration)
- **Validation**: Zod
- **Server Actions**: next-safe-action
- **Database ORM**: Drizzle
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 4
- **Editor**: CodeMirror 6
- **E2E Testing**: Playwright
- **Unit Testing**: Vitest

## Key Points for Code Changes

- **Secrets**: Never hardcode secrets; use `.env` and validated `serverEnv`
- **Database**: Always validate requests with Zod before querying; use `db` from `~/lib/db`
- **Components**: Prefer shadcn/ui over raw HTML elements
- **Testing**: Unit tests in `__tests__/lib/`, E2E tests in `__tests__/e2e/`
- **Linting**: Automated via pre-commit hook; focus on logic, not formatting
- **TODO comments**: Reference the issue tracker number (e.g., `// TODO: Fix X - #123`)

## Validation Steps Before Pushing

1. Run linter: `pnpm lint`
2. Run unit tests: `pnpm test -- --run`
3. Build: `pnpm build` (catches TypeScript errors)
4. Run E2E tests: `pnpm test:e2e`

If any step fails, fix the issue before pushing. The CI pipeline mirrors these steps.

## Planning

When asked to plan, your job is to deep-dive on the issue. Find the problem and generate a plan.
Do not write code. Explain the problem clearly and propose a comprehensive plan
to solve it.

### Your Tasks for Planning

You are an experienced software developer tasked with diagnosing issues.

1. Review the issue context and details.
2. Examine the relevant parts of the codebase. Analyze the code thoroughly
   until you have a solid understanding of how it works.
3. Explain the issue in detail, including the problem and its root cause.
4. Create a comprehensive plan to solve the issue. The plan should include:
   - Required code changes
   - Potential impacts on other parts of the system
   - Necessary tests to be written or updated
   - Documentation updates
   - Performance considerations
   - Security implications
   - Backwards compatibility (if applicable)
   - Include the reference link to the source issue and any related discussions
5. Think deeply about all aspects of the task. Consider edge cases, potential
   challenges, and best practices for addressing the issue. If Context7 is available, use it to query documentation to better inform your plan.

**ONLY CREATE A PLAN. DO NOT WRITE ANY CODE.** Your task is to create
a thorough, comprehensive strategy for understanding and resolving the issue.
