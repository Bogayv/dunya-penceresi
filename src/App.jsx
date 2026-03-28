import { useState, useEffect } from "react";

const SOURCES = [
  { id: "all", label: "TÜMÜ", url: "https://www.reutersagency.com/feed/" },
  { id: "ekonomi", label: "EKONOMİ", url: "https://www.ft.com/?format=rss" },
  { id: "finans", label: "FİNANS", url: "https://www.wsj.com/xml/rss/3_7031.xml" },
  { id: "jeopolitik", label: "JEOPOLİTİK", url: "https://www.theguardian.com/world/rss" },
  { id: "borsa", label: "BORSA", url: "https://www.bloomberght.com/rss" }
];

export default function GlobalHaberler() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState(SOURCES[0]);

  useEffect(() => {
    fetchNews();
  }, [activeTag]);

  async function fetchNews() {
    setLoading(true);
    try {
      // EN STABİL CORS TÜNELİ: rss2json kullanmadan doğrudan XML çekiyoruz
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(activeTag.url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      // XML'i basitçe parçalıyoruz
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, "text/xml");
      const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 15);
      
      const processed = items.map(item => ({
        id: item.querySelector("guid")?.textContent || Math.random(),
        title: item.querySelector("title")?.textContent,
        link: item.querySelector("link")?.textContent,
        description: item.querySelector("description")?.textContent?.replace(/<[^>]*>?/gm, '').slice(0, 150),
        pubDate: item.querySelector("pubDate")?.textContent?.slice(0, 16)
      }));

      setNews(processed);
    } catch (e) {
      console.error("Haberler çekilemedi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#05070a", color: "#e0e0e0", fontFamily: "monospace" }}>
      <header style={{ borderBottom: "1px solid #1e2d4a", padding: "20px 32px", background: "#0a0d14", textAlign: "center" }}>
        <h1 style={{ color: "#c9a96e", margin: 0, fontSize: "24px", letterSpacing: "5px" }}>WORLD WINDOWS NETWORK</h1>
        <div style={{ color: "#4a6080", fontSize: "10px", marginTop: "10px" }}>TERMINAL_STATUS: ONLINE // ENCRYPTED_STREAM</div>
      </header>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", padding: "15px", background: "#0a0d14", borderBottom: "1px solid #1e2d4a" }}>
        {SOURCES.map(s => (
          <button key={s.id} onClick={() => setActiveTag(s)} style={{ 
            padding: "8px 15px", background: activeTag.id === s.id ? "#c9a96e" : "transparent",
            color: activeTag.id === s.id ? "#05070a" : "#4a6080", border: "1px solid #1e2d4a", cursor: "pointer", fontSize: "10px"
          }}>{s.label}</button>
        ))}
      </div>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        {loading ? (
          <div style={{ color: "#c9a96e", textAlign: "center", fontSize: "12px" }}>[ SYSTEM ] FETCHING_GLOBAL_INTELLIGENCE...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
            {news.map(n => (
              <div key={n.id} onClick={() => window.open(n.link, "_blank")} style={{ 
                background: "#0a0d14", border: "1px solid #1e2d4a", padding: "20px", cursor: "pointer", position: "relative"
              }}>
                <div style={{ color: "#c9a96e", fontSize: "9px", marginBottom: "10px" }}>// URGENT_NEWS_FLASH</div>
                <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", lineHeight: "1.4" }}>{n.title}</h3>
                <p style={{ fontSize: "13px", color: "#8a9ab0", lineHeight: "1.6" }}>{n.description}...</p>
                <div style={{ color: "#3a5278", fontSize: "9px", marginTop: "15px", borderTop: "1px dotted #1e2d4a", paddingTop: "10px" }}>RECEIVED: {n.pubDate}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
