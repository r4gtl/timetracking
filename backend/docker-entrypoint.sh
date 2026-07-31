#!/bin/sh
set -e

if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
  until nc -z "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}"; do
    sleep 0.5
  done
  echo "PostgreSQL is up."
fi

exec "$@"
