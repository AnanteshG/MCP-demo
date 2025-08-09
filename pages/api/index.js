// Root MCP endpoint - accessible at /api/index
export default async function handler(req, res) {
  // Set comprehensive CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle GET for server discovery
  if (req.method === "GET") {
    return res.status(200).json({
      name: "News MCP Server",
      version: "1.0.0",
      description: "MCP server for fetching news headlines and user validation",
      protocol: "mcp/1.0",
      capabilities: ["tools"],
      endpoints: {
        primary: "/api/mcp",
        root: "/api/index",
        validate: "/api/validate",
        news: "/api/getNews",
      },
      status: "ready",
      instructions: "Use /api/mcp as the primary MCP endpoint",
    });
  }

  // Redirect POST requests to main MCP endpoint
  if (req.method === "POST") {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const mcpUrl = `${protocol}://${host}/api/mcp`;

    try {
      const response = await fetch(mcpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...req.headers,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to proxy to MCP endpoint",
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
