// MCP Server Implementation following Model Context Protocol
export default async function handler(req, res) {
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
    const { method, params } = req.body;

    switch (method) {
      case "initialize":
        return handleInitialize(req, res, params);

      case "tools/list":
        return handleToolsList(req, res, params);

      case "tools/call":
        return handleToolCall(req, res, params);

      default:
        return res.status(400).json({
          error: {
            code: -32601,
            message: "Method not found",
            data: { method },
          },
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: {
        code: -32603,
        message: "Internal error",
        data: { details: error.message },
      },
    });
  }
}

function handleInitialize(req, res, params) {
  return res.status(200).json({
    jsonrpc: "2.0",
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

function handleToolsList(req, res, params) {
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
    result: {
      tools,
    },
  });
}

async function handleToolCall(req, res, params) {
  const { name, arguments: toolArgs } = params;

  try {
    switch (name) {
      case "validate":
        return await handleValidateTool(req, res, toolArgs);

      case "getNews":
        return await handleGetNewsTool(req, res, toolArgs);

      default:
        return res.status(400).json({
          error: {
            code: -32602,
            message: "Unknown tool",
            data: { tool: name },
          },
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: {
        code: -32603,
        message: "Tool execution failed",
        data: { tool: name, error: error.message },
      },
    });
  }
}

async function handleValidateTool(req, res, toolArgs) {
  const { token } = toolArgs;

  if (!token || token !== process.env.MCP_BEARER_TOKEN) {
    return res.status(200).json({
      jsonrpc: "2.0",
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

async function handleGetNewsTool(req, res, toolArgs) {
  try {
    // Make internal call to getNews API
    const response = await fetch(
      `${req.headers["x-forwarded-proto"] || "https"}://${
        req.headers.host
      }/api/getNews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MCP_BEARER_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`News API returned ${response.status}`);
    }

    const newsData = await response.json();

    return res.status(200).json({
      jsonrpc: "2.0",
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
