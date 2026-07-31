"""Development settings: DEBUG on, Postgres running locally via Docker."""

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", default="timetracker"),
        "USER": env("POSTGRES_USER", default="timetracker"),
        "PASSWORD": env("POSTGRES_PASSWORD", default="timetracker"),
        "HOST": env("POSTGRES_HOST", default="localhost"),
        "PORT": env("POSTGRES_PORT", default="5432"),
    }
}

# Allow the Vite dev server to call the API.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
