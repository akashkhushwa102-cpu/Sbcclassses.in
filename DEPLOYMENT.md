# Deployment notes — Frontend (Supabase Static) + Backend (container)

Frontend (Supabase Static Sites)
- Build locally: `npm install` then `npm run build` (Vite builds into `dist/`).
- Recommended: connect your GitHub repo to Supabase Static Sites and let it build on push.
- Manually: upload the `dist/` output via the Supabase dashboard or CI artifacts.

Backend (containerized) — quick options
- Local test with Docker Compose (builds the backend image and reads `backend/.env`):

```bash
docker compose build
docker compose up
```

- Deploy container to a provider that supports Docker (Render, Railway, Fly.io, DigitalOcean App Platform):
  - Use the included `backend/Dockerfile`.
  - Set environment variables (do NOT commit secrets): `DATABASE_URL`, `VITE_SUPABASE_SERVICE_KEY`, `JWT_SECRET`, etc.
  - For Render: create a new Web Service, use Dockerfile deploy or the repo build and set `Start Command` to `npm start`.

Environment variables and secrets
- Do NOT commit production secrets. Set them in the host's environment/config panel.
- Required for production (examples): `DATABASE_URL`, `JWT_SECRET`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SERVICE_KEY`, `EMAIL_USER`, `EMAIL_PASSWORD`.

Next steps I can take for you
- Prepare a Render `render.yaml` or Railway setup and create PR files.
- Connect the repo to Supabase Static Sites (requires access/authorization).
- Deploy the backend to Render using the Dockerfile (I can prepare `render.yaml`).

Automated deploy manifests

- `render.yaml` (backend): contains a Docker-based Render service definition. Fill secret values in Render dashboard or via `render` CLI before creating the service.
- GitHub Actions (frontend): a workflow is added at `.github/workflows/deploy-supabase-static.yml` which builds the frontend and uses the Supabase CLI to deploy the `dist/` output to Supabase Static Sites. The workflow expects these repository secrets:
  - `SUPABASE_ACCESS_TOKEN` — a Supabase access token with deployment privileges
  - `SUPABASE_PROJECT_REF` — your Supabase project reference (found in the Supabase dashboard)

Notes & next steps
- Confirm which branch should trigger automatic deploys (workflow currently triggers on `main`).
- Add the required secrets to GitHub and/or Render before running the workflow or creating the Render service.
- If you want me to set up a Render `secret`-backed config file or a CI deploy to Render, I can prepare that next.
