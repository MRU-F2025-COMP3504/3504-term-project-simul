# Contributing to Simul

Welcome to Simul! This document provides guidelines and information for contributors to help you understand the project architecture and development workflow.

## Project Overview

Simul is a communication platform built with Next.js and React. The project uses modern web technologies and is designed for scalable development with a focus on type safety and performance.

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 15.5.4 with React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **TypeScript**: For type safety and better developer experience
- **Build Tool**: Turbopack (Next.js's bundler)
- **Package Manager**: pnpm (preferred) or npm
- **Development Environment**: Nix (optional but recommended)
- **Linting**: ESLint with Next.js configuration

### Project Structure

```
├── .github/                 # GitHub workflows and templates
├── nix/                     # Nix development environment configuration
├── public/                  # Static assets (images, icons, etc.)
├── src/
│   └── app/                 # Next.js App Router structure
│       ├── globals.css      # Global styles and Tailwind imports
│       ├── layout.tsx       # Root layout component
│       └── page.tsx         # Home page component
├── eslint.config.mjs        # ESLint configuration
├── flake.nix               # Nix flake configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
└── tsconfig.json           # TypeScript configuration
```

### Key Architecture Decisions

- **App Router**: Uses Next.js 13+ App Router for improved routing and layouts
- **TypeScript**: Strict TypeScript configuration for type safety
- **Component Structure**: React components organized in the `src/app` directory
- **Styling**: Tailwind CSS with custom theme configuration
- **Path Aliases**: `~/*` alias points to `./src/*` for cleaner imports

## Development Environment Setup

### Option 1: Using Nix (Recommended)

If you have Nix installed, you can use the provided development shell:

```bash
nix develop
```

This will automatically set up:
- Node.js 23
- pnpm
- Bash
- Alejandra (Nix formatter)

### Option 2: Standard Setup

If you prefer not to use Nix:

1. Install Node.js (version 23 recommended)
2. Install pnpm globally: `npm install -g pnpm`
3. Install dependencies: `pnpm install`

## Development Workflow

### Getting Started

1. Clone the repository
2. Set up your development environment (see above)
3. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

4. Start the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Create production build with Turbopack
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style Guidelines

#### TypeScript

- Use strict TypeScript configuration
- Prefer type inference where possible
- Use proper typing for React components and props
- Follow existing patterns in the codebase

#### React/Next.js

- Use functional components with hooks
- Follow Next.js App Router conventions
- Use proper component file naming (PascalCase)
- Import components and utilities using the `~/` alias when appropriate

#### CSS/Styling

- Use Tailwind CSS classes for styling
- Follow Tailwind's utility-first approach
- Use CSS custom properties defined in `globals.css` for theming
- Maintain responsive design patterns

#### File Organization

- Place new pages in the `src/app` directory following App Router structure
- Keep components close to where they're used
- Use descriptive file and directory names
- Follow existing naming conventions

### Linting and Code Quality

The project uses ESLint with Next.js configuration. Run linting before submitting changes:

```bash
pnpm lint
# or
npm run lint
```

ESLint configuration extends:
- `next/core-web-vitals`
- `next/typescript`

## Contributing Process

### Before You Start

1. Check existing issues and pull requests
2. Create or comment on an issue to discuss your proposed changes
3. Fork the repository if you're an external contributor

### Making Changes

1. Create a new branch from `main`
2. Make your changes following the style guidelines
3. Test your changes locally
4. Run linting and ensure no errors
5. Write descriptive commit messages

### Pull Request Guidelines

1. Provide a clear description of your changes
2. Reference any related issues
3. Ensure your code follows the project's style guidelines
4. Make sure the build passes (note: font loading may fail due to network restrictions)
5. Request review from maintainers

### Commit Message Format

Use clear, descriptive commit messages:

```
feat: add new component for user authentication
fix: resolve navigation issue on mobile devices
docs: update API documentation
style: format code according to project standards
```

## Communication

- **Discord**: Primary communication platform for the team
- **Google Drive**: Project documentation is available at the shared drive
- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Use GitHub discussions for general questions

## Development Notes

### Known Issues

- Font loading from Google Fonts may fail in restricted network environments
- Build process uses Turbopack which may have different behavior than Webpack

### Performance Considerations

- The project uses Turbopack for faster builds in development
- Images should be optimized using Next.js Image component
- Consider code splitting for larger components

## Need Help?

- Check existing documentation in the Google Drive
- Ask questions in the Discord channel
- Review existing code patterns in the repository
- Create an issue for bugs or feature requests

## License

License TBD - see project maintainers for licensing information.

---

Thank you for contributing to Simul!