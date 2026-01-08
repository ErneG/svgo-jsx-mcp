#!/bin/sh
set -e

echo "Running Prisma db push to ensure database schema is up to date..."
npx prisma db push --schema=./prisma/schema.prisma --url="$DATABASE_URL"

echo "Starting server..."
exec node dist/server.js
