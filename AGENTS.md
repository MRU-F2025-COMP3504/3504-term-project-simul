# AGENTS.md - Project Guide for AI Assistants

This file contains important information about the Simul project to help AI coding assistants work more effectively.

## Project Overview

**Simul** is a coding practice and session recording platform built for educational purposes. It allows instructors to create coding challenges and record/playback student coding sessions with CodeMirror integration.

**Repository**: https://github.com/MRU-F2025-COMP3504/3504-term-project-simul

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Database**: PostgreSQL (Drizzle ORM)
- **Code Editor**: CodeMirror 6 (@uiw/react-codemirror)
- **Package Manager**: pnpm
- **Linting**: ESLint (@antfu/eslint-config)
- **Build Tool**: Turbopack
- **Environment**: Nix (optional dev shell)

## Frequently Used Commands

### Development

```bash
# Start development server (with database)
pnpm dev

# Start dev server only (without database)
pnpm next dev --turbopack

# Start database only
pnpm db:start

# Stop database
pnpm db:stop
```

### Build & Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Database

```bash
# Push schema changes to database
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Linting

```bash
# Run linter
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

### Testing

**⚠️ Note**: Tests are located in `__tests__`, but are not currently needed.

### Import Alias

Use `~/*` for imports from `src/`:

```typescript
import { Button } from "~/components/ui/button";
// ✅ Correct
import { db } from "~/lib/db";

// ❌ Wrong
import { db } from "../../../lib/db";
```

### Environment Variables

**Never** access `process.env` directly. Always use the validated env:

```typescript
// ✅ Correct
import { serverEnv } from "~/lib/env";

const dbUrl = serverEnv.DATABASE_URL;

// ❌ Wrong - will fail ESLint
const dbUrl = process.env.DATABASE_URL;
```

### Server Actions

Use `next-safe-action` with Zod validation:

```typescript
import { z } from "zod";

import { actionClient } from "~/lib/safe-action";

export const myAction = actionClient
  .schema(z.object({ name: z.string() }))
  .action(async ({ parsedInput }) => {
    // Server-side logic
    return { success: true };
  });
```

### Component Styling

- Use **Tailwind CSS** for styling
- Use **shadcn/ui** components when possible
- Dark mode support via `next-themes`
- Follow the [component styling guide](docs/component-styling-guide.md) for theming

## Database

- **ORM**: Drizzle
- **Dialect**: PostgreSQL
- **Schema location**: `src/lib/db/scheme/index.ts`
- **Migrations**: `src/lib/db/migrations/` (auto-generated)
- **Naming convention**: snake_case (enforced by Drizzle config)

### Database Connection

```typescript
import { db } from "~/lib/db";

// Use Drizzle queries
const users = await db.select().from(usersTable);
```

## Special Files & Ignored Patterns

Files that should **NOT** be linted/modified:

- `src/components/ui/*` - shadcn/ui auto-generated components
- `src/lib/db/migrations/*` - Drizzle migrations
- `next-env.d.ts` - Next.js types
- `reports/*.md` - Project reports
- `docs/*.md` - Documentation
