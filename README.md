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

## Deployment

- Il backend gira su Render come Web Service Docker, definito via
  `render.yaml` (Render Blueprint). Il primo collegamento del repo a Render
  va fatto una tantum dalla dashboard (New > Blueprint); da lì in poi ogni
  `git push` su main triggera un deploy automatico.
- Le variabili con `sync: false` in `render.yaml` (`DJANGO_SECRET_KEY`,
  `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`) vanno
  inserite a mano su Render dopo la prima creazione del servizio, perché
  dipendono dal dominio assegnato da Render stesso e dal provider del
  database (Neon/Supabase) — non sono nel file per sicurezza e per evitare
  un problema "uovo e gallina" sul dominio.
- Il frontend è deployato separatamente su Vercel o Netlify (build Vite
  standard, nessun file di configurazione dedicato necessario); l'unica
  variabile da impostare lì è `VITE_API_BASE_URL`, puntata all'URL
  pubblico del backend Render (es.
  `https://timetracker-backend.onrender.com/api`).
- Al termine del primo deploy, l'entrypoint Docker esegue collectstatic +
  migrate automaticamente (vedi `docker-entrypoint.sh`), quindi non serve
  eseguire comandi manuali su Render dopo il primo avvio corretto.

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
