// Diagnostic endpoint to log all requests from Puch AI
export default function handler(req, res) {
  console.log("=== MCP Diagnostic Log ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Query:", req.query);
  console.log("Body:", req.body);
  console.log("========================");

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight OK" });
  }

  // Return diagnostic info
  res.status(200).json({
    message: "MCP Diagnostic Endpoint",
    received: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
    },
    timestamp: new Date().toISOString(),
    server: "News MCP Server v1.0.0",
  });
}
