#!/bin/sh
set -e

PRISMA="node /app/node_modules/prisma/build/index.js"
TSX="node /app/node_modules/tsx/dist/esm/cli.mjs"
DB_PATH="/app/data/cffs.db"

# Initialize database if it doesn't exist
if [ ! -f "$DB_PATH" ]; then
  echo "==> First run: initializing database..."
  $PRISMA db push --url "$DATABASE_URL" 2>&1
  echo "==> Loading seed data..."
  $TSX prisma/seed.ts 2>&1
  echo "==> Database ready."
else
  echo "==> Existing database found, applying schema updates..."
  $PRISMA db push --url "$DATABASE_URL" 2>&1
  echo "==> Database up to date."
fi

exec "$@"
