# Doener — frontend

A calm, minimal workout-tracking app for logging sessions, planning your week, and training together with a friend.

## Local setup

```bash
npm install
cp .env.example .env   # then set VITE_API_BASE_URL to your backend's URL
npm run dev
```

The app runs at `http://localhost:5173` by default.

Other scripts:

```bash
npm run build   # type-check + production build (dist/)
npm run test    # bone-length validation for the motion guide poses
npm run lint    # oxlint
```

## Configuration

This app talks to the Doener backend **exclusively** through the `VITE_API_BASE_URL`
build-time environment variable (see `src/api/client.ts`) — there is no hardcoded
backend URL anywhere in the source. Vite inlines this variable into the JS bundle at
build time, so it must be set *before* `npm run build` / `npm run dev` runs.

## Deployment

This repository is fully standalone — it does not reference, import from, or depend on
a sibling backend repository in any way. It is deployed independently (e.g. on Railway)
using the included multi-stage `Dockerfile`:

1. **Build stage**: installs dependencies and runs `npm run build`, with
   `VITE_API_BASE_URL` passed in as a Docker build `ARG`/`ENV` (Railway sets this as a
   build-time variable on the service).
2. **Runtime stage**: serves the built `dist/` as static files via nginx
   (`nginx.conf` includes an SPA fallback so client-side routes like `/today` work on
   refresh).

To point the deployed frontend at a different backend, change the `VITE_API_BASE_URL`
build variable and redeploy — no code changes required.

## Stack

React + Vite + TypeScript + Tailwind CSS + React Router + TanStack Query + Recharts.
