# Repository Guidelines

## Project Structure & Module Organization

This is a React 19 single-page application built with TypeScript and Vite. Application code lives in `src/`: route-level views belong in `src/pages/`, reusable UI in `src/components/`, shared state providers in `src/contexts/`, API clients in `src/services/`, and general utilities in `src/shared/`. Shared TypeScript definitions live under `src/types/`. Keep static files that need stable URLs in `public/`; global styles and Tailwind theme tokens are defined in `src/index.css`. Production container configuration is in `Dockerfile` and `nginx.conf`.

## Build, Test, and Development Commands

Use Node.js 24 or newer and install locked dependencies with `npm ci`.

- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` type-checks the project and creates the production bundle in `dist/`.
- `npm run lint` checks all TypeScript and TSX files with ESLint.
- `npm run preview` serves the built bundle locally for a production-style check.

No automated test command is configured yet. Before opening a pull request, run at least `npm run lint` and `npm run build`.

## Coding Style & Naming Conventions

Follow the existing Prettier configuration: two-space indentation, double quotes, semicolons, and trailing commas. Prettier also sorts Tailwind classes. Use PascalCase for React components and page files (`HomePage.tsx`), camelCase for functions and variables, and descriptive names for services and utilities. Prefer functional components, explicit TypeScript types at module boundaries, and theme utilities such as `text-primary` over hardcoded colors. ESLint enforces TypeScript, React Hooks, and Vite refresh rules.

## Testing Guidelines

When adding a test framework, place tests beside their source as `*.test.ts` or `*.test.tsx`, and add an `npm test` script. Cover new behavior, error paths, routing, and API interactions. Until then, document manual verification steps in the pull request.

## Commit & Pull Request Guidelines

Create branches from `develop` using `feature/`, `fix/`, `docs/`, or `chore/` prefixes; never push directly to `main`. Commits must follow Conventional Commits, for example `feat: add profile settings page`, with a subject of at least 10 characters. Husky runs lint-staged before commits and commitlint afterward.

Pull requests should include a concise summary, linked issue when applicable, verification steps, and screenshots or recordings for visual changes. Keep changes focused and ensure lint and build checks pass.

## Configuration & Security

Copy `.env.example` for local configuration. Only expose browser-safe values under the `VITE_` prefix, and never commit secrets, access tokens, or environment-specific credentials.
