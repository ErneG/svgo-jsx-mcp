FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/

# Copy Prisma schema (needed for postinstall script)
COPY packages/web/prisma ./packages/web/prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy shared package
COPY packages/shared ./packages/shared

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

# Copy web package
WORKDIR /app
COPY packages/web ./packages/web

WORKDIR /app/packages/web

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client and build
RUN pnpm db:generate
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/web/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./.next/static

# Copy Prisma schema for migrations
COPY --from=builder /app/packages/web/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync database schema and start server
CMD ["sh", "-c", "npx prisma db push && node server.js"]
