# Environment Setup

## Overview
Configure local development, development server, and production environments for the Meal Planner app. This guide covers required environment variables, local servers, HTTPS for PWA, and deployment notes.

## 1) Environment Files

Create a `.env` in the project root (values shown are placeholders):

```env
# Supabase
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Claude / AI
# Client-side (used for feature gating; proxy still required)
VITE_CLAUDE_ENABLED=true
# Server-side (used by local Node proxy and/or Netlify Function)
CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY

# EmailJS
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Local Node proxy server (port for Express server)
AI_PROXY_PORT=3002

# Optional: Override API base (when using local servers)
VITE_API_BASE=http://localhost:3002
```

Recommended: also commit a `.env.example` with the same keys and placeholder values.

## 2) Local Development

- Install deps: `npm install`
- Start Vite dev server: `npm run dev` (default: http://localhost:5173)
- Start local AI proxy: `node server.js` (expects `CLAUDE_API_KEY`; listens on `AI_PROXY_PORT` 3002 by default)

Environment detection in services:
- Development: uses `http://localhost:3002/api/claude`
- Production: uses Netlify Function `/.netlify/functions/claude`

## 3) HTTPS for PWA Testing (Local)

Some PWA features require HTTPS. For local HTTPS:

```bash
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 5173
```

Open `https://localhost:3001` to test installability and service worker behavior.

Update CSP to allow localhost HTTPS and websockets if needed (see `docs/security.md`).

## 4) Netlify / Production Configuration

Netlify will build the static site and deploy serverless functions.

- `netlify.toml` already points functions to `netlify/functions`
- Ensure environment variables are set in Netlify dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `CLAUDE_API_KEY`
  - `VITE_CLAUDE_ENABLED=true`
  - `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`

No need to set `VITE_API_BASE` in production; services auto-detect and call `/.netlify/functions/claude`.

## 5) Supabase Setup (Quick)

- Follow `SUPABASE_SETUP.md` to create project and tables
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`
- Verify auth works by logging in via the app

## 6) Common Issues

- 404 on AI calls in prod: ensure Netlify Functions are deployed and `CLAUDE_API_KEY` is set
- CSP blocking fonts/APIs: update CSP sources (see `docs/security.md`)
- `net::ERR_CONNECTION_REFUSED` to `http://localhost:3002`: ensure `server.js` is running
- PWA not installing: access over HTTPS and verify manifest/service worker

## 7) Quick Verification Checklist

- [ ] `.env` present locally with required keys
- [ ] `npm run dev` serves app on http://localhost:5173
- [ ] `node server.js` serves AI proxy on http://localhost:3002
- [ ] AI suggestions work locally
- [ ] Supabase auth works (login/logout)
- [ ] On Netlify, Functions respond at `/.netlify/functions/claude`
- [ ] HTTPS tested for PWA as needed
