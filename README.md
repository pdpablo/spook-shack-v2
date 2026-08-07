# Spook Shack V2

Spook Shack V2 is a Base44-powered threat-intelligence workspace for ingesting public and approved CTI sources, normalizing records, and reviewing them through analyst-friendly dashboards.

## Features

- Source registry for RSS, Telegram, and other intel feeds
- Scheduled ingestion with per-source rate limits
- Telegram channel ingestion for vulnerability alerts and CVE posts
- Feed filtering, source dashboards, and correlation views
- Docker-first deployment

## Local development

```bash
npm install
npm run build
npm run dev
```

For the Base44 local backend, use the Base44 CLI workflow described in `AGENTS.md` and `README`-embedded Base44 docs.

## Docker

### Local

```bash
docker compose up --build
```

Open:

- http://127.0.0.1:8080

### Environment variables

Set these in `.env` or your platform's environment editor:

```env
SPOOK_SHACK_V2_IMAGE_TAG=latest
VITE_BASE44_APP_ID=
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
VITE_BASE44_FUNCTIONS_VERSION=
```

- `VITE_BASE44_APP_BASE_URL` should point at the Base44 app/backend URL your frontend uses.
- The container writes those values into `/runtime-config.js` at startup so the app can run with runtime config instead of a rebuild.

### Hostinger / GHCR

1. Push a release tag such as `v1.0.0` to GitHub.
2. The GitHub Actions workflow publishes `ghcr.io/pdpablo/spook-shack-v2:v<release>` tag variants on Git tags like `v1.0.0`.
3. In Hostinger Docker Manager, use `docker-compose.hostinger.yml`.
4. Paste the environment variables above into hPanel.
5. Attach your domain `spook-shack.com` to the container service.

## Notes

- The frontend still talks to the Base44 backend through the SDK.
- Docker here packages the app into a deployable web container, while Base44 handles the app data services.
