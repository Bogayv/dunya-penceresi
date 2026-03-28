export default async function handler(req, res) {
  const { query } = req.query;
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=oyncyf0mgh8v7e5lq9w5z9yqyv8u78moxg8p9r9j`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Haberler çekilemedi" });
  }
}
