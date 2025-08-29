# trend-lens

## TrendLens — what it does

TrendLens is a SaaS application (Angular + NestJS) that helps businesses and creators boost their reach and sales by leveraging real-time trend intelligence.
The platform analyzes social media and search data, predicts upcoming trends, and enables users to quickly launch ad campaigns with ready-to-use creatives and ROI reports.

🔑 Key Features

- Real-time trend monitoring (TikTok, Instagram, X, Google Trends, Reddit).
- Trend forecasting powered by machine learning.
- AI-assisted campaign creator (copy & visuals).
- Integrations with Google Ads, Meta Ads, Firebase and more.
- Dashboard with KPIs, live monitoring, and performance reports.

## Tech Stack

- Frontend: Angular 19 (standalone), RxJS, Angular Signals
- UI: Angular Material
- i18n: ngx-translate
- Charts: Chart.js
- Backend: NestJS + Prisma
- Database: PostgreSQL
- Caching/Queue: Redis (optional in MVP)
- Dev/Infra: Docker Compose, Swagger (OpenAPI)

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


---

## Architektura i Angular Signals

Projekt korzysta z Angular 19 i Angular Signals tam, gdzie ma to uzasadnienie i nie wymaga dużej przebudowy:
- UIStateService: stan ładowania jako signal + computed isLoadingGlobal.
- CompanyStateService: obiekt company przechowywany jako signal.
- AppShellComponent: wykrywanie breakpointu (BreakpointObserver) jako toSignal; computed dla `sidenavMode` i `sidenavOpened`; efekt (effect) do ustawiania koloru marki w CSS.
- CampaignCreatorComponent: `ActivatedRoute.queryParamMap` jako toSignal + effect do synchronizacji `trendId` i `products`; reszta stanu jako signals.

Dodatkowe porządki:
- Usunięto wszystkie wystąpienia `console.log` w repozytorium:
  - backend/src/swagger.ts używa teraz `Logger` z NestJS zamiast `console.log`.
  - backend/prisma/seed.ts używa `console.info` dla informacji o powodzeniu seedowania.
- Usunięto zbędne komentarze w modyfikowanych plikach.

Uwaga: W miejscach, gdzie strumienie HTTP (Observable) są konsumowane jednorazowo (np. wywołania API), pozostawiono `.subscribe(...)`, aby nie wprowadzać nadmiernych zmian architektonicznych. Signals zostały zastosowane wszędzie tam, gdzie dawało to bezpośrednią korzyść w komponentach/stanie UI.
