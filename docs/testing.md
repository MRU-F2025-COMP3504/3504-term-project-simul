# Test Infrastructure

This project uses Vitest for unit/component testing and Playwright for end-to-end testing.

## Running Tests

### Unit/Component Tests (Vitest)

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui
```

### E2E Tests (Playwright)

```bash
# Run e2e tests
pnpm test:e2e

# Run e2e tests with UI
pnpm test:e2e:ui

# Run e2e tests in headed mode (see the browser)
pnpm test:e2e:headed
```

## Test Structure

- `__tests__/` - All test files
  - `__tests__/e2e/` - Playwright end-to-end tests (`.spec.ts`)
  - `__tests__/lib/`, `__tests__/components/`, etc. - Unit and component tests mirroring the `src/` directory structure
  - Tests should have `.test.ts` or `.spec.ts` extension
  - Import source files using the `~/` path alias

## Configuration

- `playwright.config.ts` - Playwright configuration
- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Global test setup

## Continuous Integration

Tests run automatically on pull requests to the main branch via GitHub Actions.

### Workflows

- **Test** (`test.yaml`) - Runs Vitest unit tests
- **E2E Tests** (`test-e2e.yaml`) - Runs Playwright end-to-end tests

### Path-based Triggers

CI workflows are triggered only when relevant files are modified:

- **Test workflows** trigger on changes to:
  - `.ts`, `.tsx` files
  - Test configuration files (`vitest.config.ts`, `playwright.config.ts`, etc.)
  - `package.json`, `pnpm-lock.yaml`
  - Files in `src/` or `__tests__/`
  - CI configuration files (`.github/workflows/*.yaml`)

## Notes

- E2E tests will automatically start the dev server on port 3000
- The Playwright test suite includes chromium and firefox browsers
- Tests run in parallel by default (except on CI)
- Changes to documentation files (`.md`) in `docs/` or `reports/` will not trigger test suites.
