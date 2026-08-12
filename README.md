# Spook Shack V2

Spook Shack V2 is a self-hosted threat-intelligence workspace for ingesting public and approved CTI sources, normalizing records, and reviewing them through analyst-friendly dashboards.

## Features

- Source registry for RSS, Telegram, and other intel feeds
- Scheduled ingestion with per-source rate limits
- Telegram channel ingestion for vulnerability alerts and CVE posts
- Feed filtering, source dashboards, and correlation views
- SQLite-backed persistence with a built-in Node backend and legacy JSON migration
- Docker-first deployment

## Local development

```bash
npm install
npm run build
npm run dev
```

The local backend runs on port `8787` and Vite proxies `/api` requests to it.

### Demo credentials

The first startup seeds two local accounts:

- `admin@spook.shack` / `SpookShack123!`
- `analyst@spook.shack` / `SpookShack123!`

## Docker

### Local

```bash
docker compose up --build
```

Open:

- http://127.0.0.1:8080

The app stores JSON data in the `spook-shack-data` volume at `/app/data`.

### Environment variables

Set these in `.env` or your platform's environment editor:

```env
SPOOK_SHACK_V2_IMAGE_TAG=latest
SPOOK_SHACK_DEMO_PASSWORD=SpookShack123!
PORT=8080
```

Optional ingestion keys can also be provided to enrich the sources that support them:

```env
HIBP_API_KEY=
RANSOMWARE_LIVE_PRO_API_KEY=
TELEGRAM_CHANNEL=
```

### Hostinger / GHCR

1. In Hostinger Docker Manager, use `docker-compose.hostinger.yml`.
2. Set `SPOOK_SHACK_DEMO_PASSWORD=SpookShack123!` in hPanel (or your own value).
3. Attach your domain `spook-shack.com` (and optionally `www.spook-shack.com`) to the container service.
4. If you prefer GHCR pulls instead of building from source, publish the release image and set `SPOOK_SHACK_V2_IMAGE_TAG=v1.0.0` in hPanel.

## Notes

- This repository no longer depends on the Base44 SDK or Vite plugin.
- The local backend serves the API and the built frontend from the same container in production.
