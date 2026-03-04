# 🏰 Chateau Base — Wine Estate Management Game

Browser-based wine estate simulation. Build your vineyard, ferment grapes, age wines in oak barrels, and grow your fortune.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript |
| State | Zustand |
| Backend | Fastify + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Auth | JWT |
| Deploy | Docker Compose |

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)

### 1. Start Database

```bash
docker compose up db -d
```

### 2. Setup Server

```bash
cd server
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Setup Client

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** — register and start playing!

## Game Loop

```
🏪 Shop → Buy saplings & barrels
     ↓
🍇 Vineyard → Plant, grow, harvest
     ↓
🛢️ Winery → Ferment → (optional) Age in oak → Collect wine
     ↓
💰 Sell wine for $CORK → Buy more!
```

## Production Deploy

```bash
# Set secrets in .env
docker compose up --build -d
```

## Project Structure

```
chateau-base/
├── client/          # Vite + React SPA
│   └── src/
│       ├── pages/   # WelcomePage, HubPage, ShopPage, VineyardPage, WineryPage, AcademyPage
│       ├── components/ # HUD
│       ├── store/   # Zustand (playerStore)
│       └── services/# API client
├── server/          # Fastify REST API
│   └── src/
│       ├── routes/  # auth, player, shop, vineyard, winery
│       ├── db/      # Drizzle schema, migrations, seed
│       └── config.ts
├── docker-compose.yml
└── README.md
```

## License

MIT
