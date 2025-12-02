import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpServer } from "./server.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main() {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true
  });

  await mcpServer.connect(transport);

  const server = http.createServer((req, res) => {
    transport.handleRequest(req, res).catch(err => {
      console.error("Transport error:", err);
      res.writeHead(500).end("Transport error");
    });
  });

  server.listen(PORT, () => {
    console.log(`Symphony MCP server (HTTP) listening on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error("Server error:", err);
  process.exit(1);
});
