# Prisma Postgres Migration (Render + Supabase)

This project now uses Prisma datasource settings compatible with Supabase Postgres:

- `provider = "postgresql"`
- `url = env("DATABASE_URL")`
- `directUrl = env("DIRECT_URL")` (recommended for migrations)

## 1) Environment setup

Add these environment variables (no real values shown here):

```bash
DATABASE_URL="..."
DIRECT_URL="..."
```

## 2) Local Prisma commands

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev -- --name init_postgres
```

## 3) Deployment migration command (Render)

Run this in your deploy/release phase:

```bash
npm run prisma:migrate:deploy
```

## 4) Existing SQLite data migration path

Run the one-time migration script (idempotent upsert):

```bash
npm run db:migrate:sqlite-to-postgres
```

Notes:

- Script reads from local `data/app.db`
- Writes to Postgres with Prisma upserts on `Product.slug` and `Order.orderId`
- Existing media URLs in `media_json` and payment URLs are preserved as-is
