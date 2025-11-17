# Contributing to Simul

The goal here isn’t to teach you _everything_, but to give you a clear and comfortable starting point for making meaningful contributions.

## Before You Start

1. **Make sure you can run the project locally.**
   - Read the steps in `README.md`, and the files in`docs/`.
   - Install the project with `pnpm install`.
   - Run the app with `pnpm dev` for development and `pnpm build` for production.

2. **Get your environment configured.**
   - Copy `.env.example` to `.env.local` and fill in as much as you can.
   - If you get stuck, ask in the group chat. That’s normal.

## Understanding the Work

We track work using **GitHub Issues**: everything that needs to be done lives there.

- **Epics** are _large, conceptual goals_ (for example, “Build authentication”).
  Don’t assign yourself to an epic, as it’s not directly actionable.
- **Actionable issues** are tasks you can pick up and work on (for example, “Add sign-in button”).
- **Subissues** are smaller pieces of work under a bigger issue. If something feels too big or unclear, **create a subissue** to break it down.

If you’re unsure what an issue means, **ask** or **open a “Research” subissue** (for example, “Research how to use Drizzle relationships”).
This helps everyone learn together.

## Workflow Overview

### 1. Fork and Clone

If you’re not already working from the main repository:

- Clone it locally:

  ```bash
  git clone https://github.com/MRU-F2025-COMP3504/3504-term-project-simul.git
  cd 3504-term-project-simul
  ```

### 2. Create a Branch

Always make a new branch for your work:

```bash
git checkout -b feat/short-description
```

Keep branch names short and descriptive, like:

- `fix/auth-redirect`
- `feat/code-editor-theme`
- `docs/add-component-guide`

As a rule of thumb, use `feat/` for new features, `fix/` for bug fixes, and `docs/` for documentation changes.

### 3. Make Your Changes

Work on your branch and make frequent commits with clear messages:

```bash
git add .
git commit -m "feat: add dark mode button to navbar"
```

> Note: Try to follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages. This makes it easier to understand the history.

When you’re ready,

Push your branch to GitHub:

```bash
git push origin feat/code-editor-theme
```

### 4. Open a Pull Request (PR)

Once you’re ready for review:

- Go to your branch on GitHub.
- Click **“Compare & Pull Request”**.
- Add a short description of **what** you changed and **why**.
- Tag a teammate or two for review.

If you’re not finished but want feedback, create a **Draft PR**.

## Running Tests Locally

To run end-to-end tests locally using Playwright, you'll need to install the browser dependencies:

```bash
pnpm exec playwright install
```

Then run the tests with:

```bash
pnpm test:e2e
```
To run unit tests using Vitest, run:

```bash
pnpm test
```
For more information on testing, such as information on test structure, configuration, and continuous integrations, please refer to the [testing docs](docs/testing.md)


## Creating and Working With Issues

- If you see something wrong, confusing, or missing: **open an issue**.
- If something’s too broad: **break it into subissues**.
- If you need to learn more before solving something: create a **Research** issue (e.g., _“Research next-safe-action validation”_).
- Assign yourself when you start working on something: that helps others know what’s in progress.

## Asking for Help

This is a **school project**, so **please ask for help** when you need it!

- Ask questions in Discord or comment directly on the issue or PR.
- Pair program if you’re stuck.
- If something looks wrong, point it out (kindly). Peer review is how we get better.

## Best Practices

- **Small commits, frequent pushes**: makes reviews easier.
- **One issue per PR**: don’t bundle multiple tasks.
- **Keep docs in sync** with code changes.
- **Run `pnpm lint`** before committing. The pre-commit hook handles this too.
- **Read your teammates’ PRs**: reviews are one of the best learning tools.

## If You’re Unsure What to Work On

- Check **open issues** in GitHub.
- Ask in Discord which ones could use a hand.
- Start a **Research** issue if something looks unfamiliar — for example:
  - “Research how to configure ESLint for shadcn components”
  - “Research how authentication tokens are handled in middleware”

## Getting Feedback

When you submit a PR:

- Expect comments: that’s part of the process.
- Don’t take feedback personally; it’s about improving the project.
- Once approved, merge your own PR unless told otherwise.

## Documentation

For more detailed information on specific parts of the project, check out the `docs/` folder.

## Sandboxed Code Execution (WIP)

> Note: This part of the markdown is isolated to only relate to the `feat/piston` branch.

After running `git fetch`, if needed, and then `git checkout feat/piston` the `docker-compose.yml` file should be updated to run a containerized Piston server which deals with code execution. The tests are a bit different so the starting code will reflect this change. 

