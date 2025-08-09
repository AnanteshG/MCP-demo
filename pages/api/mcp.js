export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  res.status(200).json({
    tools: [
      {
        name: "getNews",
        description: "Fetch top 5 headlines from major news sites",
        method: "POST",
        url: "https://mcp-demo-gamma.vercel.app/api/getNews",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      },
      {
        name: "validate",
        description: "Validate bearer token and return phone number",
        method: "POST",
        url: "https://mcp-demo-gamma.vercel.app/api/validate",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ]
  });
}
