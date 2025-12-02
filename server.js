import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import * as z from "zod";

dotenv.config();

const BASE_URL = "https://api.symphony.io";

const payloadSchema = z.object({}).passthrough();
const stringSchema = z.string();

export const mcpServer = new McpServer({
  name: "symphony-mcp",
  version: "1.0.0"
});

function toJsonResult(data) {
  return { content: [{ type: "json", json: data }] };
}

async function callSymphony(path, method, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.SYMPHONY_API_KEY
    },
    body:
      method === "GET" || body === undefined
        ? undefined
        : JSON.stringify(body)
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message = (data && data.message) || res.statusText || "Request failed";
    throw new Error(`Symphony ${method} ${path} failed: ${message}`);
  }

  return data;
}

function registerPayloadTool(name, path, method, description) {
  mcpServer.registerTool(
    name,
    {
      description,
      inputSchema: { payload: payloadSchema }
    },
    async ({ payload }) => toJsonResult(await callSymphony(path, method, payload))
  );
}

function registerStringTool(name, description, field, pathBuilder) {
  mcpServer.registerTool(
    name,
    {
      description,
      inputSchema: { [field]: stringSchema }
    },
    async args => toJsonResult(await callSymphony(pathBuilder(args[field]), "GET"))
  );
}

mcpServer.registerTool(
  "symphonyRequest",
  {
    description: "Make a custom request to any Symphony API endpoint",
    inputSchema: {
      path: stringSchema.describe("Endpoint path like /agent/register"),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]),
      body: payloadSchema.optional()
    }
  },
  async ({ path, method, body }) => toJsonResult(await callSymphony(path, method, body))
);

// Agent Management
registerPayloadTool(
  "registerAgent",
  "/agent/register",
  "POST",
  "Register a new agent"
);
registerPayloadTool(
  "unregisterAgent",
  "/agent/unregister",
  "POST",
  "Unregister an existing agent"
);
registerPayloadTool(
  "updateAgentName",
  "/agent/update-name",
  "PUT",
  "Update an agent's name"
);
registerPayloadTool(
  "updateAgentDescription",
  "/agent/update-description",
  "PUT",
  "Update an agent's description"
);
registerPayloadTool(
  "updateAgentImage",
  "/agent/update-image",
  "PUT",
  "Update an agent's image"
);
registerPayloadTool(
  "updateAgentManager",
  "/agent/update-manager-address",
  "PUT",
  "Update an agent's manager address"
);
registerPayloadTool(
  "updateAgentPublic",
  "/agent/update-public",
  "PUT",
  "Update agent public settings"
);
registerPayloadTool(
  "updateAgentInfo",
  "/agent/update-info",
  "PUT",
  "Update general agent info"
);

// User Subscriptions
registerPayloadTool(
  "subscribeToAgent",
  "/agent/subscribe",
  "POST",
  "Subscribe a user to an agent"
);
registerPayloadTool(
  "unsubscribeFromAgent",
  "/agent/unsubscribe",
  "POST",
  "Unsubscribe a user from an agent"
);
registerStringTool(
  "getAgentSubscribers",
  "Get a list of subscribers for a given agent",
  "agentId",
  id => `/agent/${id}/subscribers`
);
registerStringTool(
  "getSubscribedAgents",
  "Get a list of agents a user is subscribed to",
  "userId",
  id => `/user/${id}/agents`
);

// Trading – Batch operations
registerPayloadTool(
  "closePerpetualsTrade",
  "/agent/batch-close",
  "POST",
  "Close a perpetuals trade for an agent"
);
registerPayloadTool(
  "spotTrade",
  "/agent/batch-swap",
  "POST",
  "Execute a spot trade for an agent"
);

// Trading – Positions & Orders
registerStringTool(
  "getAgentBatches",
  "Retrieve all batches for a given agent",
  "agentId",
  id => `/agent/${id}/batches`
);
registerStringTool(
  "getBatchPositions",
  "Retrieve positions for a specific batch",
  "batchId",
  id => `/batch/${id}/positions`
);
registerStringTool(
  "getAgentPositions",
  "Retrieve positions for a given agent",
  "agentId",
  id => `/agent/${id}/positions`
);
registerStringTool(
  "getPositionsForSmartAccount",
  "Get positions for a smart account",
  "accountId",
  id => `/smart-account/${id}/positions`
);
registerStringTool(
  "getOrdersForSmartAccount",
  "Get orders for a smart account",
  "accountId",
  id => `/smart-account/${id}/orders`
);

// Fees
registerPayloadTool(
  "setFees",
  "/fees/set",
  "POST",
  "Set fees for an agent or organization"
);
mcpServer.registerTool(
  "getOrganizationFees",
  { description: "Get fees settings for your organization" },
  async () => toJsonResult(await callSymphony("/fees/organization", "GET"))
);
registerStringTool(
  "getAgentFees",
  "Get fees settings for a specific agent",
  "agentId",
  id => `/agent/${id}/fees`
);
mcpServer.registerTool(
  "getFeesBalances",
  { description: "Get fee balances for the organization" },
  async () => toJsonResult(await callSymphony("/fees/balances", "GET"))
);

// Utilities
registerPayloadTool(
  "withdrawToken",
  "/withdraw/token",
  "POST",
  "Withdraw an ERC-20 token from the platform"
);
registerPayloadTool(
  "withdrawNative",
  "/withdraw/native",
  "POST",
  "Withdraw the native chain currency (e.g., ETH)"
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.log("Symphony MCP server is running...");
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
