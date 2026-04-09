# Vacation Control

Production-oriented monorepo for vacation / employee movement management: **Next.js** (App Router), **NestJS** API, **MS SQL Server** (Docker), orchestrated with **Turborepo** and **npm workspaces**.

## Prerequisites

- Node.js 20+ and **npm**
- Docker Desktop (or Docker Engine) for local SQL Server

## Install

From the repository root:

```bash
npm install
```

This installs root tooling and links all workspaces under `apps/*` and `packages/*`.

## Development

1. Copy environment template and adjust values:

   ```bash
   cp .env.example .env
   ```

2. Start the API and web app (runs tasks in parallel via Turborepo; workspace libraries build first):

   ```bash
   npm run dev
   ```

   - **Web**: [http://localhost:3000](http://localhost:3000)  
   - **API**: [http://localhost:4000](http://localhost:4000)  
   - **Health**: [http://localhost:4000/health](http://localhost:4000/health)

## Database (Docker)

Ensure `SA_PASSWORD` in root `.env` meets SQL Server complexity rules (length + mixed case, numbers, symbols).

```bash
npm run db:up    # start SQL Server 2019 (port 1433)
npm run db:logs  # follow logs
npm run db:down  # stop and remove containers (volume persists)
```

Data is stored in the named Docker volume `mssql-data`.

**Note:** The frontend does **not** connect to the database. Only the API will talk to SQL Server later (via stored procedures — no ORM for business logic).

## Other scripts

```bash
npm run build   # turbo build (all packages + apps)
npm run lint    # turbo lint
npm run format  # Prettier write
```

## Project structure

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js App Router UI (TypeScript, Tailwind CSS) |
| `apps/api` | NestJS HTTP API, modules for feature boundaries |
| `packages/types` | Shared TypeScript types |
| `packages/config` | Small shared env/config helpers |
| `packages/eslint-config` | Shared ESLint flat config |
| `db/docker` | `docker-compose.yml` for SQL Server 2019 |
| `scripts/` | Placeholder for automation |
| `xml/` | Placeholder (e.g. artifacts) |
| `docs/` | Placeholder for documentation |

## Turborepo + npm workspaces

- **npm workspaces** (`"workspaces": ["apps/*", "packages/*"]` in root `package.json`) hoist dependencies and symlink local packages (`@vacation-control/*`) so apps can depend on them with `"*"` versions.
- **Turborepo** (`turbo.json`) defines `dev`, `build`, and `lint` pipelines. Dependent packages run `build` before app `dev` tasks (`dependsOn: ["^build"]`). Multiple `dev` processes run in parallel where possible.

## API modules (stubs)

`auth`, `employees`, `movements`, `logs`, `errors`, and `database` are scaffolded for future work. `database` is reserved for a thin SQL Server client that will call **stored procedures only** (no ORM for business rules).

## License

Private / unpublished — adjust as needed.
