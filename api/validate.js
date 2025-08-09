export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bearer_token } = req.body;
  if (!bearer_token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  res.status(200).json({ phone_number: "9901470297" });
}
