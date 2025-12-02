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

## Docker (optional)
```bash
docker build -t symphony-mcp .
docker run -p 3000:3000 -e SYMPHONY_API_KEY=your_real_symphony_key_here symphony-mcp
```
Note: include the trailing `.` so Docker knows to use the current directory as the build context; omitting it triggers the `docker buildx build requires 1 argument` error.
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

## Tools exposed
- Generic `symphonyRequest`
- Agent management (register/unregister/update variations)
- Subscriptions (subscribe/unsubscribe/list subscribers/agents)
- Trading (batch close, batch swap, positions/orders helpers)
- Fees (set/get org/agent fees, balances)
- Withdrawals (token, native)

Adjust `server.js` to add new endpoints or tighten validation as Symphony evolves.
