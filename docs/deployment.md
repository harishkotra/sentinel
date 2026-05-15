# Sentinel Deployment Guide

## API

1. Build: `npm run build:packages && npm run build:api`
2. Set env vars:
- `PORT`, `DATABASE_URL`, `POLICY_FILE`, `OTEL_EXPORTER_OTLP_ENDPOINT`
- `SENTINEL_MODEL_PROVIDER` (`google` | `featherless` | `lmstudio`)
- Provider vars from `apps/api/.env.example`
- Telegram approval vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SENTINEL_PUBLIC_BASE_URL`
3. Run migrations: `npm run db:migrate`
4. Start: `npm --workspace @sentinel/api run start`

## Web

1. Build: `npm run build:web`
2. Serve static output from `apps/web/dist` or run preview server.

## Recommended production setup

- API on Cloud Run/Kubernetes behind WAF.
- Keep SQLite for demo; optional Postgres is a contributor enhancement.
- OTEL collector + Grafana/Datadog.
- Centralized policy repository and signed releases.
