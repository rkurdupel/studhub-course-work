
# Student platform app design

This project contains:

- `frontend/`: React frontend
- `backend/`: Django API
- `docker-compose.yml`: single local stack for frontend, backend, and Postgres

Original design source:
https://www.figma.com/design/2UzEu1VdRn1VuhMftbbXU3/Student-platform-app-design

## Local development

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run frontend only:

```bash
cd frontend
npm run dev
```

## Full local stack

Run everything with Docker from the project root:

```bash
docker compose up --build
```

Services:

- app via nginx: `http://localhost`
- backend is internal behind nginx
- frontend is internal behind nginx

The backend container applies migrations and seeds demo subjects, chat groups, and payment requisites on startup.

## Domain and nginx

Production-style layout:

- public nginx on port `80` first, then `443` after Let's Encrypt
- frontend container internal only
- backend container internal only

Main nginx config:

- [infra/nginx/app.conf](/Users/rkurdupel/Downloads/Student platform app design/infra/nginx/app.conf)

Typical domain flow:

1. Point your domain `A` record to the EC2 Elastic IP.
2. Run this Docker stack on the EC2 instance.
3. nginx serves `yourdomain.com` and proxies:
   - `/` -> frontend
   - `/api/` -> backend
   - `/admin/` -> backend

Current target:

- `stud-hab.pp.ua` -> `51.21.231.122`
- `www.stud-hab.pp.ua` -> `stud-hab.pp.ua`

## AWS deployment

Deployment notes:

- [docs/aws-deploy.md](/Users/rkurdupel/Downloads/Student platform app design/docs/aws-deploy.md)
  
