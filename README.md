# MJ Hair Empire (V1)

Modern, mobile-first wig e-commerce website for **MJ Hair Empire** built with:

- `Express` + `EJS` (server-rendered storefront/admin)
- `Prisma` + Postgres (Supabase-ready)
- Supabase Storage uploads for product media and payment proof
- Central brand config for quick edits

This V1 is optimized for speed of launch while keeping a structure that can scale into Postgres/cloud storage later.

## Features Included

- Home page with hero, featured wigs, categories, delivery cards, testimonials, Instagram preview
- Shop page with filters (availability, color, length, price range, lace type, category) + pagination
- Product detail page with image gallery, optional video, optional 3D model viewer (`.glb/.gltf`)
- Cart page with variation summary and quantity updates
- Checkout page with MoMo instructions + optional payment proof upload
- Order confirmation page with generated Order ID + WhatsApp order summary button
- Admin dashboard (password login) for:
  - add/edit/delete products
  - upload multiple images + optional video + optional 3D model
  - manage stock/threshold/variations
  - view orders and update statuses
- SEO basics: meta tags, `robots.txt`, `sitemap.xml`
- Accessibility basics: alt text placeholders, keyboard-friendly controls, visible contrast

## Quick Start

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Set at minimum:

- `ADMIN_PASSWORD`
- `SESSION_SECRET`

## 3) Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4) Admin login

- URL: `/admin/login`
- Password: value from `.env` (`ADMIN_PASSWORD`)

## Editable Brand Settings (Central Config)

Edit all business/brand placeholders in:

- `/Users/g/Documents/Joy Website/src/config/brand.js`

This file controls:

- brand name + tagline
- colors
- MoMo number/account name
- WhatsApp number
- social links
- email
- business location
- delivery info

## Sample Product Data

Seed/sample product records live in:

- `/Users/g/Documents/Joy Website/data/sample-products.json`

The app auto-seeds these into SQLite on first run if the products table is empty.

Manual seed command:

```bash
npm run seed
```

## File Uploads (Development)

Media is uploaded to Supabase Storage buckets configured by env vars:

- `SUPABASE_PRODUCTS_BUCKET`
- `SUPABASE_PAYMENTS_BUCKET`

## Cloud Media Upgrade (Recommended Next)

Replace local `multer` disk storage with:

- `multer-s3` + AWS S3, or
- Cloudinary upload SDK

Then store remote URLs in `media_json` / `payment_proof_path` instead of local `/uploads/...` paths.

## Database (SQLite -> Postgres Path)

Runtime DB uses Prisma with Postgres (Supabase-compatible).

For one-time legacy SQLite migration, run:

```bash
npm run db:migrate:sqlite-to-postgres
```

## Project Structure

```text
src/
  config/        # Central editable brand/app settings
  db/            # SQLite init + migrations + auto-seed
  middleware/    # Admin auth middleware
  repositories/  # Data access layer (swap for Postgres later)
  routes/        # Storefront + admin routes
  public/        # CSS, JS, images, uploads
  views/         # EJS templates
  server.js      # App entry point
data/
  sample-products.json
  app.db         # Created on first run
scripts/
  seed.js
prisma/
  schema.prisma  # Upgrade blueprint (optional)
```

## Default Order Statuses

- `New`
- `Confirmed`
- `Processing`
- `Ready`
- `Delivered`
- `Cancelled`

## Notes for V1

- Cart is persisted in a signed cookie (stateless, restart-safe for Render).
- Admin auth is a single password from `.env`. Upgrade to per-user accounts/hashed passwords for production.
- Product variation selections are stored per cart item and included in WhatsApp order summaries.

## Optional Improvements (V2)

1. Replace session cart with persistent carts/accounts
2. Add image compression pipeline + thumbnails
3. Add coupon codes and delivery fee rules
4. Add real payment verification workflow
5. Add analytics + pixel integrations
6. Switch repositories to Postgres and add migrations
