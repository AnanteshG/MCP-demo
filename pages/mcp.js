// Simple MCP endpoint following Puch AI starter pattern
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      name: "News MCP Server",
      version: "1.0.0",
      description: "Fetch latest news headlines from major sources",
      status: "running",
    });
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
            capabilities: { tools: {} },
            serverInfo: {
              name: "News MCP Server",
              version: "1.0.0",
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
                description: "Validate bearer token and return phone number",
                inputSchema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Bearer token" },
                  },
                  required: ["token"],
                },
              },
              {
                name: "get_latest_news",
                description:
                  "Fetch the latest news headlines from major news sources including BBC, CNN, NDTV, The Hindu, and Reuters",
                inputSchema: {
                  type: "object",
                  properties: {},
                  additionalProperties: false,
                },
              },
            ],
          },
        });

      case "tools/call":
        const { name, arguments: toolArgs } = params;

        if (name === "validate") {
          const { token } = toolArgs || {};
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

        if (name === "get_latest_news") {
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

            if (!response.ok) {
              throw new Error(`News API returned ${response.status}`);
            }

            const newsData = await response.json();

            // Format the news data nicely
            let newsText = "📰 **Latest News Headlines**\n\n";

            Object.entries(newsData.news).forEach(([source, headlines]) => {
              if (headlines && headlines.length > 0) {
                newsText += `**${source}:**\n`;
                headlines.slice(0, 3).forEach((headline, idx) => {
                  newsText += `${idx + 1}. ${headline}\n`;
                });
                newsText += "\n";
              }
            });

            return res.status(200).json({
              jsonrpc: "2.0",
              id: id,
              result: {
                content: [{ type: "text", text: newsText }],
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
                    text: `❌ Failed to fetch news: ${error.message}`,
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
          error: { code: -32601, message: "Method not found" },
        });
    }
  } catch (error) {
    console.error("MCP Error:", error);
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
