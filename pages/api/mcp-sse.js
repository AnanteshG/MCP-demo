// MCP Server with Server-Sent Events for Puch AI compatibility
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle both HTTP POST and GET for SSE
  if (req.method === "GET") {
    // Server-Sent Events endpoint for MCP connection
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        jsonrpc: "2.0",
        method: "server/ready",
        params: {
          serverInfo: {
            name: "News MCP Server",
            version: "1.0.0",
            description:
              "MCP server for fetching news headlines and user validation",
          },
        },
      })}\n\n`
    );

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(
        `data: ${JSON.stringify({
          jsonrpc: "2.0",
          method: "ping",
        })}\n\n`
      );
    }, 30000);

    req.on("close", () => {
      clearInterval(keepAlive);
    });

    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { method, params, id } = req.body;

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
          id: id,
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
      id: req.body?.id,
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
      name: "getNews",
      description: "Fetch top 5 headlines from major news sources",
      inputSchema: {
        type: "object",
        properties: {
          sources: {
            type: "array",
            items: { type: "string" },
            description: "Optional array of news sources to fetch from",
            default: ["BBC", "CNN", "NDTV", "The Hindu", "Reuters"],
          },
        },
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

    return res.status(200).json({
      jsonrpc: "2.0",
      id: id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(newsData, null, 2),
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
