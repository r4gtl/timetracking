FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
ARG REQUIREMENTS_FILE=requirements/prod.txt
RUN pip install --no-cache-dir -r ${REQUIREMENTS_FILE}

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
# Shell form (not exec-form array) so $PORT gets substituted at runtime.
# Render injects $PORT automatically; local docker-compose overrides this
# entire CMD with its own "command:", so it's unaffected by this change.
CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
