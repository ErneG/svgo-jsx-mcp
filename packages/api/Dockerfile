FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy shared package
COPY packages/shared ./packages/shared

# Copy API package
COPY packages/api ./packages/api

WORKDIR /app/packages/api

# Generate Prisma client and build
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy built files and dependencies
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder /app/packages/api/prisma ./prisma
COPY --from=builder /app/packages/api/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/packages/api/package.json ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
