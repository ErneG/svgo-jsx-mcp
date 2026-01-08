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

# Copy Prisma schema and config (needed for postinstall script)
COPY packages/web/prisma ./packages/web/prisma
COPY packages/web/prisma.config.ts ./packages/web/prisma.config.ts

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
RUN npx prisma generate
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

# Install pnpm for running prisma commands at runtime
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (includes full monorepo structure with outputFileTracingRoot)
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./

# Copy static files and public folder to the correct location
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public ./packages/web/public

# Copy Prisma schema for runtime db push (not config.ts - it requires prisma/config module)
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/prisma ./packages/web/prisma

# Copy node_modules for prisma CLI (needed for db push)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'cd /app/packages/web' >> /app/start.sh && \
    echo 'echo "Pushing database schema..."' >> /app/start.sh && \
    echo 'npx prisma db push --schema=./prisma/schema.prisma --url="$DATABASE_URL" --accept-data-loss' >> /app/start.sh && \
    echo 'echo "Schema push completed successfully"' >> /app/start.sh && \
    echo 'cd /app' >> /app/start.sh && \
    echo 'exec node packages/web/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start with schema push then server
CMD ["/app/start.sh"]
