#!/usr/bin/env bash
set -euo pipefail

# Helper to start development databases (Postgres + Redis) using docker compose
# It also detects the Docker daemon and prints helpful guidance if it's not running.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "[dev-db] Docker CLI not found."
  echo "- Install Docker Desktop (macOS/Windows) or Docker Engine (Linux)."
  echo "- Alternatively, install Podman and enable Docker compatibility: 'alias docker=podman' or set up podman-docker."
  echo "- Or skip containers and use your own Postgres. Set backend/.env DATABASE_URL accordingly (see backend/.env.example)."
  exit 1
fi

# Check if Docker daemon is running by querying version
if ! docker info >/dev/null 2>&1; then
  echo "[dev-db] Cannot connect to Docker daemon."
  echo "Troubleshooting:"
  echo "- Linux: start the service: sudo systemctl start docker"
  echo "- Linux: allow non-root usage: sudo usermod -aG docker $USER && newgrp docker"
  echo "- macOS/Windows: start Docker Desktop app."
  echo "- Podman users: ensure 'docker' alias points to podman and podman socket is active."
  echo "- Or configure local Postgres and set backend/.env (see backend/.env.example)."
  exit 1
fi

# Start only the needed services from docker-compose
echo "[dev-db] Starting Postgres and Redis via docker compose..."
if command -v docker compose >/dev/null 2>&1; then
  docker compose up -d postgres redis
else
  # Fallback for older docker-compose
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d postgres redis
  else
    echo "[dev-db] Neither 'docker compose' nor 'docker-compose' found. Update Docker or install docker-compose."
    exit 1
  fi
fi

echo "[dev-db] Done. Postgres on localhost:5440, Redis on 6379."
echo "[dev-db] Next: cd backend && cp -n .env.example .env 2>/dev/null || true && npm i && npm run prisma:generate && npm run prisma:migrate --name init && npm run seed && npm run dev"