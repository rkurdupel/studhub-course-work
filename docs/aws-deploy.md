# AWS deployment

## Recommended simple deployment

- One EC2 Ubuntu instance
- Docker Compose
- Postgres container in same VM
- nginx on the same VM
- Your personal domain pointed to the EC2 Elastic IP

## Backend environment variables

Copy `backend/.env.production.example` to `backend/.env` on the server and fill in the real values:

```env
DJANGO_ENV=production
DJANGO_DEBUG=0
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=stud-hab.pp.ua,www.stud-hab.pp.ua,51.21.231.122
DJANGO_CORS_ALLOWED_ORIGINS=https://stud-hab.pp.ua,https://www.stud-hab.pp.ua
POSTGRES_DB=<db-name>
POSTGRES_USER=<db-user>
POSTGRES_PASSWORD=<db-password>
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

## Frontend environment variables

Set this in `frontend/.env.production` only if you want an explicit API origin.
Usually for nginx same-origin proxy you can leave it unset.

```env
VITE_API_BASE_URL=https://<your-api-domain>
```

## DNS

Create these DNS records:

- `stud-hab.pp.ua` -> `51.21.231.122`
- `www.stud-hab.pp.ua` -> `stud-hab.pp.ua`

## SSL

Use nginx + Let's Encrypt on the EC2 instance after the HTTP deployment is working.
The Docker stack already mounts:

- `infra/certbot/www`
- `infra/certbot/conf`

You can issue a cert later with certbot and then update nginx for `443`.

## Notes

- Current media uploads are stored on local container filesystem. For durable uploads in AWS, move media storage to S3 later.
