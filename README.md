# Padel Match

Manage your Padel matches & interclub games in one place.

## Cloud Sync (Cloudflare Pages)

This project includes a Pages Function route at `/api/state` in:

- `functions/api/state.ts`

Required Cloudflare Pages bindings/vars:

- KV binding: `PADEL_MATCHES_KV`

The app sends a team-specific sync token via `x-auth-token`. The backend hashes that token and stores state under an isolated KV key namespace per team.