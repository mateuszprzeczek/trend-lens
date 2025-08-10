# trend-lens

## Setup backend (with seed)

```bash
# Start Postgres & Redis (helper checks Docker and guides you if daemon is not running)
./scripts/dev-db.sh

# Backend
cd backend
# prepare env (uses port 5440 to match docker-compose); adjust if using your own Postgres
cp -n .env.example .env 2>/dev/null || true
npm i
npm run prisma:generate
npm run prisma:migrate --name init
npm run seed
npm run dev
```

Backend runs on http://localhost:3000 (Swagger docs at http://localhost:3000/docs, health at http://localhost:3000/health).

### If you can't use Docker
- Install local Postgres (or use a managed instance), then set DATABASE_URL in backend/.env. The default .env.example targets localhost:5440.
- You can run Redis locally or skip it for MVP; the app won’t hard-depend on Redis in this repository version.

### Troubleshooting Docker daemon not running
If you see: "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?"
- Linux: `sudo systemctl start docker`; to avoid sudo: `sudo usermod -aG docker $USER && newgrp docker`.
- macOS/Windows: start Docker Desktop.
- Podman: you can alias `docker` to `podman` and ensure the podman socket is active, or install `podman-docker`.
- Or skip containers: configure a local/remote Postgres and set backend/.env accordingly.

## Run frontend with proxy

```bash
cd frontend
npm i
npm start
# which is: ng serve --proxy-config proxy.conf.json
```

Frontend runs on http://localhost:4200 and proxies API requests from /api → http://localhost:3000 (see `frontend/proxy.conf.json`).
