export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (token === process.env.MCP_BEARER_TOKEN) {
    return res.status(200).json({ phone: "919901470297" });
  }

  return res.status(401).json({ error: "Invalid bearer token" });
}
