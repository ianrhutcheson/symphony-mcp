# Symphony MCP Server

Fully featured Model Context Protocol server exposing Symphony API endpoints as individual tools.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your API key in `.env`:
   ```bash
   SYMPHONY_API_KEY=your_real_symphony_key_here
   ```

## Run locally
```bash
npm start
```
The server exposes all tools defined in `server.js`. Update input schemas as you refine request payloads.

To expose HTTP locally (for tunneling to ChatGPT, etc.):
```bash
SYMPHONY_API_KEY=your_real_symphony_key_here node server-http.js
```

## Docker (optional)
The repo defaults to Fly.io's Node builder and does not ship a `Dockerfile`. If you prefer a custom image, add a minimal `Dockerfile` like:
```
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=3000
CMD ["node", "server-http.js"]
```
Then build and run locally:
```bash
docker build -t symphony-mcp .
docker run -p 3000:3000 -e SYMPHONY_API_KEY=your_real_symphony_key_here symphony-mcp
```
The container listens on port 3000 with MCP Streamable HTTP transport at `http://localhost:3000`.

## MCP Gateway example
Add to your gateway config:
```yaml
mcpServers:
  symphony:
    command: ["node", "./symphony-mcp/server.js"]
    env:
      SYMPHONY_API_KEY: "${SYMPHONY_API_KEY}"
```

## GitHub prep
- Sensitive: `.env` is already ignored; keep secrets out of Git.
- Cleanup: `.gitignore` drops node_modules and logs; add a `.dockerignore` if you opt into Docker builds.
- To publish:  
  ```bash
  git add .
  git commit -m "Add Symphony MCP server and Fly.io config"
  git push origin main   # adjust branch
  ```

## Deploy to Fly.io
`fly.toml` is included and pins Fly's Node builtin builder (no Docker needed). A `.fly/launch.json` manifest is also committed so
`flyctl launch` recognizes this as a NodeJS app instead of generating a mismatched generic manifest (the manifest `type` is
capitalized as `NodeJS` to match Fly's detector). Steps (requires `flyctl`):
```bash
fly auth login
# Optional: rename app in fly.toml (app = "symphony-mcp") to your unique name
fly secrets set SYMPHONY_API_KEY=your_real_symphony_key_here
FLY_REMOTE_BUILDER_MACHINE_SIZE=shared-cpu-1x fly deploy --config fly.toml
```
The `FLY_REMOTE_BUILDER_MACHINE_SIZE` cap keeps the Fly depot/remote builder under org CPU limits. If you prefer not to set the variable globally, run via the helper script:
```bash
./scripts/deploy-with-builder-cap.sh --build-only --push
```

The app serves MCP Streamable HTTP on port 3000 (`[http_service].internal_port=3000`). Access it at the Fly hostname returned after deploy (e.g., https://<app>.fly.dev). If you prefer a custom image build, re-add a `[build]` section pointing at `Dockerfile` and deploy again.

## Tools exposed
- Generic `symphonyRequest`
- Agent management (register/unregister/update variations)
- Subscriptions (subscribe/unsubscribe/list subscribers/agents)
- Trading (batch close, batch swap, positions/orders helpers)
- Fees (set/get org/agent fees, balances)
- Withdrawals (token, native)

Adjust `server.js` to add new endpoints or tighten validation as Symphony evolves.
