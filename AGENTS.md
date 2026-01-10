# AGENTS.md - SVGO JSX MCP

## Project Context

SVGO JSX is an SVG optimization service with JSX-compatible camelCase attribute conversion. It provides:

- A web UI for manual SVG optimization
- An MCP (Model Context Protocol) server for AI assistants
- REST API for programmatic access
- Admin dashboard for API key management and statistics

## Architecture

- **Monorepo** using pnpm workspaces
- **packages/web**: Next.js 16 app (App Router) with React 19
- **packages/api**: MCP server implementation
- **packages/shared**: Shared utilities and types

## Tech Stack

- **Framework**: Next.js 16.x with App Router
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Better Auth
- **State Management**: TanStack Query (React Query)
- **Forms**: TanStack Form with Zod validation
- **UI Components**: shadcn/ui with Radix primitives
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Testing**: Vitest with React Testing Library

## Code Quality Standards

This is **production code** deployed to users. Maintain high standards:

### TypeScript

- Strict mode enabled
- No `any` types without explicit justification
- Proper null handling with optional chaining and nullish coalescing

### React Patterns

- Use Server Components by default, "use client" only when needed
- TanStack Query for all data fetching in client components
- Proper loading and error states for async operations
- Always handle edge cases (empty data, loading, errors)

### API Routes

- Validate authentication with `auth.api.getSession()`
- Return proper HTTP status codes
- Handle BigInt serialization (convert to string for JSON)
- Use proper error responses with meaningful messages

### Database

- Use Prisma for all database access
- Prefer computed queries over denormalized aggregates when data freshness matters
- Index fields used in WHERE clauses

## Testing Requirements

- API routes should have endpoint existence tests
- Critical business logic should have unit tests
- Run `pnpm test` before committing

## Commit Conventions

Use conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Adding or updating tests
- `docs:` Documentation changes

## File Naming

- React components: PascalCase (`StatsPage.tsx`)
- Hooks: camelCase with `use` prefix (`use-stats.ts`)
- API routes: `route.ts` in folder structure
- Utils: camelCase (`formatBytes.ts`)

## Directory Structure

```
packages/web/src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── (auth)/            # Auth pages
├── components/
│   ├── ui/                # shadcn/ui components
│   └── [feature]/         # Feature-specific components
├── hooks/                 # TanStack Query hooks
├── lib/                   # Utilities (auth, prisma, utils)
└── __tests__/             # Test files
```

## Known Issues to Avoid

1. **BigInt in JSON**: Prisma BigInt must be `.toString()` before JSON response
2. **asChild with Slot**: When using Button's `asChild` prop, ensure single child element
3. **Optional chaining**: Always use `?.` with `??` for nested optional properties
4. **Server vs Client**: Don't use hooks in Server Components
