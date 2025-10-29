# Simul

## Communication Platform

Our communication will take place over Discord.

## Google Drive

Our documentation is found on
[Google Drive](https://drive.google.com/drive/u/0/folders/1hB-eFmx1e0aI7ZiNub_wzKqkfgIw4sTE)

## Getting Started

### Prerequisites

Before getting started, make sure you have the following installed on your system:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - install via `npm install -g pnpm`
- **Docker** - needed to run PostgreSQL (install from [docker.com](https://www.docker.com/))

> **Note:** Nix is available as an alternative development environment, but should only be used if you're familiar with Nix. If you're unsure, use the manual setup below.

### Environment Variables

Create a `.env` file in the root directory with the following variables. You can start with `.env.example` as a template.

**Variable Details:**

- `NODE_ENV` - Set to `development` for local development
- `DATABASE_URL` - Connection string for PostgreSQL
- `POSTGRES_USER` - PostgreSQL username (default: `postgres`)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: `postgres`, change this in production)
- `POSTGRES_PORT` - PostgreSQL port (default: `5432`)
- `POSTGRES_DB` - PostgreSQL database name (default: `simul_db`)
- `BETTER_AUTH_SECRET` - Generate a secure random string (e.g., using `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Set to your application URL (`http://localhost:3000` for local development)
- `GH_CLIENT_ID` & `GH_SECRET` - GitHub OAuth credentials (obtain from [GitHub Developer Settings](https://github.com/settings/developers))
  - Make sure to read [`docs/authentication.md`](docs/authentication.md) for more details on setting up OAuth.

### Installation & Initial Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up the database:**
   In one terminal, start the development server:

   ```bash
   pnpm dev
   ```

   In another terminal, apply the initial database migration:

   ```bash
   pnpm db:push
   ```

3. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Running Tests Locally

To run end-to-end tests locally using Playwright, you'll need to install the browser dependencies:

```bash
pnpm exec playwright install
```

Then run the tests with:

```bash
pnpm test:e2e
```

### Using Nix (Optional)

If you're familiar with Nix and want to use the development environment:

```bash
nix develop
```

Then proceed with `pnpm install` and the steps above.

---

Licence TBD © Ezzidean Azzabi, Matthew Hrehirchuk, Sunny Parmar, Bryan Naijo,
Augusto De Morais Silva
