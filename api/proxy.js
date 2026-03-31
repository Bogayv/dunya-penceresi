export default async function handler(req, res) {
  const { url, lang } = req.query;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Tarayıcıya haberin "zaten çevrilmiş" olduğunu söyleyen başlığı ekle
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(xmlText);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
}
