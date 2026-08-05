#!/bin/sh
set -e

if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
  until nc -z "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}"; do
    sleep 0.5
  done
  echo "PostgreSQL is up."
fi

# On Render's free tier the "Pre-Deploy Command" feature requires a paid
# plan, so we run collectstatic + migrate here instead, once per container
# start, but only in production (dev uses the Vite/runserver workflow and
# doesn't need static files collected).
if [ "$DJANGO_SETTINGS_MODULE" = "config.settings.prod" ]; then
  echo "Production settings detected: collecting static files and applying migrations..."
  python manage.py collectstatic --noinput
  python manage.py migrate --noinput
fi

exec "$@"