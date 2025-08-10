# trend-lens

## Setup

```bash
docker compose up -d
npm i
npm run prisma:generate
npm run prisma:migrate --name init
npm run seed
npm run dev
```

## Development

The application will be available at http://localhost:3000/health
