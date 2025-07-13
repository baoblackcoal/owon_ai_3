# Gemini Project Context: owon_ai_cloudflare

## Project Overview

This is the Owon AI official website project. It's a full-stack web application built with **Next.js 15 (App Router)** and designed for deployment on the **Cloudflare** serverless platform. The project uses **OpenNext** to adapt the Next.js output for Cloudflare Workers and leverages **Cloudflare D1** for its database.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Package Manager**: pnpm (configured with `node-linker=hoisted` in `.npmrc` to support Windows)
- **Deployment**: Cloudflare Workers & Pages via OpenNext and Wrangler
- **Database**: Cloudflare D1
- **Linting**: ESLint with Next.js core web vitals config
- **Styling**: Tailwind CSS (inferred from dependencies)

## Project Structure

- `nextjs/`: The main directory for the Next.js application.
  - `src/app/`: Contains the application's pages and API routes using the App Router.
  - `src/app/api/`: Location for backend API endpoints.
  - `public/`: Static assets that are publicly accessible.
  - `wrangler.jsonc`: Configuration file for Cloudflare Wrangler, defining the worker name, D1 database bindings, and other deployment settings.
  - `open-next.config.ts`: Configuration for the OpenNext adapter.
  - `package.json`: Defines project scripts, dependencies, and metadata.
- `.cursor/rules/`: Contains specific guidelines for development workflow, project structure, and coding standards.
- `doc/dev/`: Contains supplementary development documentation.

## Key Commands

All commands should be run from the `nextjs/` directory.

- **Install dependencies**: `pnpm install`
- **Run standard development server (no D1 binding)**: `pnpm dev`
  - Access at `http://localhost:3000`.
- **Run local preview server (with D1 binding)**: `pnpm preview`
  - This command uses Wrangler to simulate the Cloudflare environment locally.
- **Build for production**: `pnpm build`
- **Lint code**: `pnpm lint`
- **Type check**: `pnpm run check` (builds and runs `tsc`)
- **Deploy to Cloudflare**: `pnpm run deploy`
  - This script chains `opennextjs-cloudflare build` and `opennextjs-cloudflare deploy`.

## Development Workflow

1.  **Branching**: Create a feature branch from `main` (e.g., `feature/your-feature`).
2.  **Local Development**:
    - For UI and logic not dependent on D1, use `pnpm dev`.
    - For logic requiring D1 database access, use `pnpm preview`. The D1 binding is defined in `wrangler.jsonc`.
3.  **Code Quality**: Run `pnpm lint` to check for linting errors before committing.
4.  **Committing**: Follow the [Conventional Commits](https://www.conventionalcommits.org) specification for commit messages.
5.  **Pull Request**: Push the feature branch and create a Pull Request to `main`.

## Deployment

- The project is deployed to Cloudflare using the `pnpm run deploy` command.
- This command first builds the Next.js application using OpenNext, then deploys the generated assets and worker script to Cloudflare Pages and Workers.
- **First-time setup**: Requires creating a D1 database in the Cloudflare dashboard and updating `wrangler.jsonc` with the correct `account_id` and `database_id`.

## Coding Standards

- **TypeScript**: Strict mode is enabled. Unused function parameters should be prefixed with an underscore (e.g., `_request`).
- **API Routes**: Do not manually specify `export const runtime = 'edge'`. OpenNext handles this automatically.
- **D1 Access**: Use the `getCloudflareContext` function from `@opennextjs/cloudflare` to access the D1 binding (`env.DB`).
- **Error Handling**: Wrap asynchronous operations in `try...catch` blocks and provide meaningful error messages.
