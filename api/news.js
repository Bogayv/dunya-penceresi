export default async function handler(req, res) {
  const { rss_url } = req.query;
  if (!rss_url) return res.status(400).json({ error: "RSS URL gerekli" });

  try {
    // rss2json servisini bir "sunucu" gibi kullanıyoruz
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss_url)}&api_key=oyncyf0mgh8v7e5lq9w5z9yqyv8u78moxg8p9r9j`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Veri çekilemedi" });
  }
}
