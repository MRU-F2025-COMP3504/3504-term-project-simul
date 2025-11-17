# Simul

Currently a beta release (**v1.0.0**). Find it under our [GitHub Releases](https://github.com/MRU-F2025-COMP3504/3504-term-project-simul/releases).

Simul aims to make learning programming more interactive. Instructors can upload their coding problem walkthroughs and students can access these walkthroughs and jump in whenever they want to play around with the code. To setup the project locally jump to [Getting Started](#getting-started). If you are a developer looking to be a potential contributor checkout our [contributor guidelines](CONTRIBUTING.md). 

## How to Use Simul
Login with your GitHub account and select your role; student (incomplete) and instructor. Since the student role is a work in process we recommend sticking just to using the instructor role. Start a recording as you work through a problem and then save it. Reload the page to see the new recording. "Play" the recording or scrub through the timeline, pause when needed, and edit the code. At any point you can submit the code to see if it passes the tests (sandboxed code is a WIP; check out our [Sandboxed Code Execution (WIP)](CONTRIBUTING.md#sandboxed-code-execution-wip) section in [CONTRIBUTING.MD](CONTRIBUTING.md)).

## Report a Bug
This bug reporting guide is based off of Mozilla's [Bug Writing Guidelines](https://bugzilla.mozilla.org/page.cgi?id=bug-writing.html): 

1. Open up a new GitHub Issue with the `Bug` tag
2. Indicate reproducibility of the bug (consistently, ocassionally, not at all)
3. If reproducible list the steps taken alongside the intent of the step
4. Describe the expected vs. actual result of your actions

Current known bugs are already listed and updated in the GitHub Issues page. 

## Communication Platform

Our communication will take place over [Discord](https://discord.gg/v4JCjR7dKk).

## Google Drive

Our documentation is found on
[Google Drive](https://drive.google.com/drive/u/0/folders/1hB-eFmx1e0aI7ZiNub_wzKqkfgIw4sTE).

## Getting Started

### Prerequisites

Before getting started, make sure you have the following installed on your system:

- **Node.js** (v20 or higher)
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

### Using Nix (Optional)

If you're familiar with Nix and want to use the development environment:

```bash
nix develop
```

Then proceed with `pnpm install` and the steps above.

---

Licence TBD © Ezzidean Azzabi, Matthew Hrehirchuk, Sunny Parmar, Bryan Naijo,
Augusto De Morais Silva
