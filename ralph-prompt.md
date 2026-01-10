# Ralph Loop Prompt - SVGO JSX Feature Expansion

You are working on a major feature expansion for SVGO JSX. Your job is to complete tasks from the PRD.

## Instructions

### 1. Read Context

- Read `prd.json` to find the next incomplete task (`passes: false`)
- Read `progress.txt` to understand current state
- Read `AGENTS.md` for project standards

### 2. Execute ONE Task

- Pick the HIGHEST PRIORITY incomplete task (lowest phase, then lowest id)
- If task has `hitl: true`, start the dev server for manual verification
- Implement ONLY that single task
- Keep changes small and focused

### 3. Run Feedback Loops (MUST ALL PASS)

Run these commands and ensure they all pass:

```bash
# TypeScript type checking
cd packages/web && npx tsc --noEmit

# Run tests
pnpm test

# Lint check
pnpm lint

# Build (final verification)
pnpm build
```

Do NOT proceed if any feedback loop fails. Fix issues first.

### 4. Commit & Update

- Commit changes with conventional commit message (feat:, fix:, etc.)
- Append progress to `progress.txt` (use verb "append" - don't overwrite!)
- Set `passes: true` for the completed task in `prd.json`

### 5. Stop Conditions

- If all tasks in current phase complete: `<promise>PHASE_COMPLETE</promise>`
- If ALL tasks complete: `<promise>COMPLETE</promise>`
- If blocked (need human input): `<promise>BLOCKED</promise>`

## Quality Gates

- [ ] All feedback loops pass (types, tests, lint, build)
- [ ] Changes are minimal and focused on the task
- [ ] Commit message follows conventions
- [ ] progress.txt updated with what was done
- [ ] prd.json task marked as passes: true

## Project-Specific Notes

### Monorepo Structure

- `packages/web` - Next.js 16 app (main focus)
- `packages/shared` - Shared utilities (generators, validator, etc.)
- `packages/api` - CLI/MCP server

### Key Patterns

- Use "use client" only when needed (hooks, events)
- Dynamic imports for Monaco Editor to avoid SSR issues
- TanStack Query for data fetching
- shadcn/ui for UI components
- Proper error handling and loading states

### Editor Page Notes

- Monaco Editor requires dynamic import: `next/dynamic` with `ssr: false`
- Use SVG language for syntax highlighting
- Debounce optimization calls (300ms)
- Show before/after preview panels

### Generator Notes

- Each generator in `packages/shared/src/generators/`
- Export all from `generators/index.ts`
- Add unit tests for each generator

### Theme Notes

- Use `next-themes` package
- CSS variables in globals.css for light/dark
- ThemeProvider in root layout

## Small Steps Principle

Quality over speed. Each iteration should:

- Complete ONE task
- Run ALL feedback loops
- Make ONE atomic commit
- Update progress tracking

Small steps compound into big progress.
