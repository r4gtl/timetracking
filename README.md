# Timetracker

Full-stack time tracking & invoicing app (Clockify-like), scaffolding only —
no business logic yet.

## Stack

- **Backend**: Django 5 + Django REST Framework, Python 3.12
- **Database**: PostgreSQL 16 (Docker)
- **Frontend**: React 18 + TypeScript + Vite
- **Auth**: djangorestframework-simplejwt (configured, not wired up yet)

## Project structure

```
timetracker/
├── backend/            # Django project (config/, apps/, requirements/)
├── frontend/           # Vite + React + TypeScript app
├── docker-compose.yml  # postgres + backend
└── README.md
```

## Running locally

### 1. Backend + database (Docker)

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

This starts:
- `db`: Postgres 16 on `localhost:5432`
- `backend`: Django dev server on `http://localhost:8000` (hot-reload via bind mount)

Run migrations (once the containers are up) in a second terminal:

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 2. Frontend (Vite dev server)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173` and is pre-configured (via
`django-cors-headers`) to call the backend at `http://localhost:8000`.

## Running the backend without Docker (optional)

```bash
cd backend
python -m venv .venv
./.venv/Scripts/activate        # Windows
pip install -r requirements/dev.txt
cp .env.example .env            # set POSTGRES_HOST=localhost
python manage.py check
python manage.py migrate
python manage.py runserver
```

Requires a reachable Postgres instance (e.g. `docker-compose up db`).

## Environment variables

- `backend/.env.example` — Django settings, database, CORS (copy to `backend/.env`)
- `frontend/.env.example` — `VITE_API_BASE_URL` (copy to `frontend/.env`)

## Settings layout

- `config/settings/base.py` — shared settings
- `config/settings/dev.py` — `DEBUG=True`, local Postgres via Docker
- `config/settings/prod.py` — reads everything from environment variables (Render)

## Apps

Empty Django apps, registered in `INSTALLED_APPS`, ready for models:

- `apps.clients` — Client
- `apps.projects` — Project, Task
- `apps.timesheet` — TimeEntry, Rate
- `apps.invoicing` — Invoice
