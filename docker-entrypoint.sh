#!/bin/sh
set -e

DB_PATH="/app/data/cffs.db"

# Initialize database if it doesn't exist
if [ ! -f "$DB_PATH" ]; then
  echo "==> First run: initializing database..."
  npx prisma db push --skip-generate 2>&1
  echo "==> Loading seed data..."
  npx tsx prisma/seed.ts 2>&1
  echo "==> Database ready."
else
  echo "==> Existing database found, running migrations..."
  npx prisma db push --skip-generate 2>&1
  echo "==> Database up to date."
fi

exec "$@"
