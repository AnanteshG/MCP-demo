// WebSocket MCP Server for Puch AI compatibility
import { createServer } from "http";
import { parse } from "url";

export default function handler(req, res) {
  // For HTTP requests, redirect to WebSocket
  if (req.method === "GET") {
    const wsUrl = `wss://${req.headers.host}/api/mcp-ws`;
    return res.status(200).json({
      name: "News MCP Server",
      version: "1.0.0",
      description: "MCP server for fetching news headlines and user validation",
      protocol: "mcp/1.0",
      capabilities: ["tools"],
      endpoints: {
        websocket: wsUrl,
        http: "/api/mcp",
      },
      instructions: {
        connect: `Use WebSocket connection: ${wsUrl}`,
        fallback: "HTTP endpoint available at /api/mcp",
      },
    });
  }

  // Handle HTTP MCP requests as fallback
  return handleHttpMcp(req, res);
}

async function handleHttpMcp(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { jsonrpc, method, params, id } = req.body;

    if (jsonrpc !== "2.0") {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: id || null,
        error: { code: -32600, message: "Invalid Request" },
      });
    }

    switch (method) {
      case "initialize":
        return res.status(200).json({
          jsonrpc: "2.0",
          id: id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, logging: {} },
            serverInfo: {
              name: "News MCP Server",
              version: "1.0.0",
              description:
                "MCP server for fetching news headlines and user validation",
            },
          },
        });

      case "tools/list":
        return res.status(200).json({
          jsonrpc: "2.0",
          id: id,
          result: {
            tools: [
              {
                name: "validate",
                description:
                  "Validate bearer token and return user phone number",
                inputSchema: {
                  type: "object",
                  properties: {
                    token: {
                      type: "string",
                      description: "Bearer token to validate",
                    },
                  },
                  required: ["token"],
                },
              },
              {
                name: "getNews",
                description: "Fetch top 5 headlines from major news sources",
                inputSchema: {
                  type: "object",
                  properties: {
                    sources: {
                      type: "array",
                      items: { type: "string" },
                      description: "Optional array of news sources",
                    },
                  },
                },
              },
            ],
          },
        });

      case "tools/call":
        const { name, arguments: toolArgs } = params;

        if (name === "validate") {
          const { token } = toolArgs;
          if (!token || token !== process.env.MCP_BEARER_TOKEN) {
            return res.status(200).json({
              jsonrpc: "2.0",
              id: id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ error: "Invalid bearer token" }),
                  },
                ],
                isError: true,
              },
            });
          }
          return res.status(200).json({
            jsonrpc: "2.0",
            id: id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ phone: "919901470297" }),
                },
              ],
            },
          });
        }

        if (name === "getNews") {
          try {
            const protocol = req.headers["x-forwarded-proto"] || "https";
            const host = req.headers.host;
            const newsUrl = `${protocol}://${host}/api/getNews`;

            const response = await fetch(newsUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.MCP_BEARER_TOKEN}`,
              },
              body: JSON.stringify({}),
            });

            const newsData = await response.json();
            return res.status(200).json({
              jsonrpc: "2.0",
              id: id,
              result: {
                content: [
                  { type: "text", text: JSON.stringify(newsData, null, 2) },
                ],
              },
            });
          } catch (error) {
            return res.status(200).json({
              jsonrpc: "2.0",
              id: id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      error: "Failed to fetch news",
                      details: error.message,
                    }),
                  },
                ],
                isError: true,
              },
            });
          }
        }

        return res.status(200).json({
          jsonrpc: "2.0",
          id: id,
          error: {
            code: -32602,
            message: "Unknown tool",
            data: { tool: name },
          },
        });

      default:
        return res.status(200).json({
          jsonrpc: "2.0",
          id: id || null,
          error: {
            code: -32601,
            message: "Method not found",
            data: { method },
          },
        });
    }
  } catch (error) {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal error",
        data: { details: error.message },
      },
    });
  }
}
