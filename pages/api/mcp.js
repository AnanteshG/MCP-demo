// MCP Server Implementation following Model Context Protocol
export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle GET request for server info/discovery
  if (req.method === "GET") {
    return res.status(200).json({
      name: "News MCP Server",
      version: "1.0.0",
      description: "MCP server for fetching news headlines and user validation",
      protocol: "mcp/1.0",
      capabilities: ["tools"],
      endpoints: {
        mcp: "/api/mcp",
      },
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse JSON body
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { jsonrpc, method, params, id } = body;

    // Validate JSON-RPC format
    if (jsonrpc !== "2.0") {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: id || null,
        error: {
          code: -32600,
          message: "Invalid Request - jsonrpc must be '2.0'",
        },
      });
    }

    switch (method) {
      case "initialize":
        return handleInitialize(req, res, params, id);

      case "tools/list":
        return handleToolsList(req, res, params, id);

      case "tools/call":
        return handleToolCall(req, res, params, id);

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
    console.error("MCP Server Error:", error);
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

function handleInitialize(req, res, params, id) {
  return res.status(200).json({
    jsonrpc: "2.0",
    id: id,
    result: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        logging: {},
      },
      serverInfo: {
        name: "News MCP Server",
        version: "1.0.0",
        description:
          "MCP server for fetching news headlines and user validation",
      },
    },
  });
}

function handleToolsList(req, res, params, id) {
  const tools = [
    {
      name: "validate",
      description: "Validate bearer token and return user phone number",
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
      name: "get_latest_news",
      description:
        "Fetch the latest news headlines from major news sources including BBC, CNN, NDTV, The Hindu, and Reuters",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  ];

  return res.status(200).json({
    jsonrpc: "2.0",
    id: id,
    result: {
      tools,
    },
  });
}

async function handleToolCall(req, res, params, id) {
  const { name, arguments: toolArgs } = params;

  try {
    switch (name) {
      case "validate":
        return await handleValidateTool(req, res, toolArgs, id);

      case "getNews":
      case "get_latest_news":
        return await handleGetNewsTool(req, res, toolArgs, id);

      default:
        return res.status(200).json({
          jsonrpc: "2.0",
          id: id,
          error: {
            code: -32602,
            message: "Unknown tool",
            data: { tool: name },
          },
        });
    }
  } catch (error) {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: id,
      error: {
        code: -32603,
        message: "Tool execution failed",
        data: { tool: name, error: error.message },
      },
    });
  }
}

async function handleValidateTool(req, res, toolArgs, id) {
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

  // Return the phone number as required by Puch AI docs
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

async function handleGetNewsTool(req, res, toolArgs, id) {
  try {
    // Make internal call to getNews API
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

    // Format the news data nicely for Puch AI
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
        content: [
          {
            type: "text",
            text: newsText,
          },
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
