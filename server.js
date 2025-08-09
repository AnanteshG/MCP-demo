import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

// Required validate endpoint for Puch AI
app.post("/validate", (req, res) => {
  const { bearer_token } = req.body;
  if (!bearer_token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  res.json({ phone_number: "9901470297" }); // Your number here
});

// Utility function to scrape headlines
async function scrapeHeadlines(url, selector) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const headlines = [];
    $(selector).each((i, el) => {
      const text = $(el).text().trim();
      if (text) headlines.push(text);
    });
    return headlines.slice(0, 5); // First 5 headlines
  } catch (err) {
    console.error(`Error scraping ${url}:`, err.message);
    return [];
  }
}

// /getNews tool
app.post("/getNews", async (req, res) => {
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

  res.json({ news: results });
});

app.listen(3000, () => {
  console.log("News MCP server running on port 3000");
});
