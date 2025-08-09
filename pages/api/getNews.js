import axios from "axios";
import * as cheerio from "cheerio";

async function scrapeHeadlines(url, selector) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    return $(selector).map((_, el) => $(el).text().trim()).get().slice(0, 5);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token || token !== process.env.MCP_BEARER_TOKEN) {
    return res.status(401).json({ error: "Invalid bearer token" });
  }

  const newsSources = [
    { name: "BBC", url: "https://www.bbc.com/news", selector: "h3" },
    { name: "CNN", url: "https://edition.cnn.com/world", selector: "h3" },
    { name: "NDTV", url: "https://www.ndtv.com/latest", selector: ".newsHdng a" },
    { name: "The Hindu", url: "https://www.thehindu.com/news/", selector: "h3" },
    { name: "Reuters", url: "https://www.reuters.com/world/", selector: "h3" }
  ];

  const results = {};
  for (const source of newsSources) {
    results[source.name] = await scrapeHeadlines(source.url, source.selector);
  }

  res.status(200).json({ news: results });
}
