import { useState, useEffect, useRef, memo, useMemo } from "react";

const GLOBAL_TAGS = [
  { id: "all", label: "TÜMÜ", urls: ["http://feeds.bbci.co.uk/news/world/rss.xml", "https://www.theguardian.com/world/rss", "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "https://www.reutersagency.com/feed/"]},
  { id: "ekonomi", label: "EKONOMİ/FT", urls: ["https://www.ft.com/?format=rss", "https://www.economist.com/sections/economics/rss.xml", "https://www.wsj.com/xml/rss/3_7014.xml"]},
  { id: "finans", label: "FİNANS/WSJ", urls: ["https://www.wsj.com/xml/rss/3_7031.xml", "https://www.cnbc.com/id/10000664/device/rss/rss.html"]},
  { id: "jeopolitik", label: "JEOPOLİTİK", urls: ["https://www.theguardian.com/world/rss", "https://www.aljazeera.com/xml/rss/all.xml"]},
  { id: "gold", label: "GOLD/SILVER", urls: ["https://www.kitco.com/rss/index.xml"]},
  { id: "borsa", label: "BORSA", urls: ["https://www.bloomberght.com/rss", "https://www.bigpara.com/rss/"]},
];

const getRelativeTime = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
};

const TradingViewLiveTicker = memo(() => {
  const container = useRef();
  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript"; script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "OANDA:XAUUSD", "title": "GOLD" },
        { "proName": "OANDA:XAGUSD", "title": "SILVER" },
        { "proName": "TVC:UKOIL", "title": "BRENT" },
        { "proName": "FX:USDTRY", "title": "USD/TRY" },
        { "proName": "BINANCE:BTCUSDT", "title": "BTC" }
      ],
      "showSymbolLogo": true, "colorTheme": "dark", "isTransparent": false, "displayMode": "regular", "locale": "tr", "backgroundColor": "#000000"
    });
    container.current.appendChild(script);
  }, []);
  return <div style={{ background: "#000", borderBottom: "1px solid #1e2d4a", minHeight: "46px" }} ref={container}></div>;
});

export default function GlobalHaberler() {
  const [newsPool, setNewsPool] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState(GLOBAL_TAGS[0]);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { fetchCollectiveNews(); return 60; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTag]);

  useEffect(() => { fetchCollectiveNews(); setTimeLeft(60); }, [activeTag]);

  async function fetchCollectiveNews() {
    setLoading(true);
    try {
      const allFetchedNews = [];
      const fetchPromises = activeTag.urls.map(async (url) => {
        try {
          // GÜNCEL PROXY: En stabil tünel ile çekiyoruz
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=oyncyf0mgh8v7e5lq9w5z9yqyv8u78moxg8p9r9j`);
          const data = await res.json();
          if (data.status === "ok" && data.items) {
            return data.items.map(item => ({
              id: item.guid || item.link,
              baslik: item.title,
              kaynak: data.feed.title || "Global",
              url: item.link,
              img: item.enclosure?.link || item.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(item.title.slice(0,5))}/800/450`,
              timestamp: new Date(item.pubDate).getTime()
            }));
          }
        } catch (e) { return []; }
      });
      const results = await Promise.all(fetchPromises);
      results.forEach(batch => { if(batch) allFetchedNews.push(...batch); });
      setNewsPool(allFetchedNews.sort((a,b) => b.timestamp - a.timestamp));
    } catch (e) { console.error("Error"); } finally { setLoading(false); }
  }

  const displayData = useMemo(() => ({
    radar: newsPool.slice(0, 8),
    archive: newsPool.slice(8, 60)
  }), [newsPool]);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8e6e0", fontFamily: "'Georgia', serif" }}>
      <style>{`
        .tag-bar { display: flex; gap: 8px; overflow-x: auto; padding: 12px 32px; background: #0d1424; border-bottom: 1px solid #1e2d4a; position: sticky; top: 0; z-index: 100; }
        .tag-pill { padding: 6px 16px; background: #080c14; border: 1px solid #1e2d4a; border-radius: 4px; color: #4a6080; font-size: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; transition: 0.2s; }
        .tag-pill.active { background: #c9a96e; border-color: #c9a96e; color: #0d1424; }
        .news-slider { display: flex; gap: 24px; overflow-x: auto; padding: 20px 32px 40px; }
        .news-card { min-width: 420px; max-width: 420px; background: #0d1424; border: 1px solid #1e2d4a; border-radius: 12px; cursor: pointer; overflow: hidden; position: relative; transition: 0.3s; }
        .news-card:hover { border-color: #c9a96e; transform: translateY(-5px); }
        .news-card img { width: 100%; height: 240px; object-fit: cover; border-bottom: 3px solid #c9a96e; }
        .archive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; padding: 0 32px 60px; }
        .archive-card { background: #0d1424; border: 1px solid #1e2d4a; border-radius: 8px; cursor: pointer; padding: 15px; }
      `}</style>

      <header style={{ background: "#0d1424", padding: "20px 32px", borderBottom: "1px solid #1e2d4a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ color: "#c9a96e", margin: 0, fontSize: "28px", letterSpacing: "3px", fontWeight: "900" }}>WORLD WINDOWS</h1>
          <div style={{ color: "#c9a96e", fontWeight: "bold", fontSize: "12px" }}>SYNC: {timeLeft}s</div>
        </div>
      </header>

      <div className="tag-bar">
        {GLOBAL_TAGS.map(t => (
          <div key={t.id} className={`tag-pill ${activeTag.id === t.id ? 'active' : ''}`} onClick={() => setActiveTag(t)}>#{t.label}</div>
        ))}
      </div>
      
      <TradingViewLiveTicker />

      <main>
        {loading && newsPool.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px", color: "#c9a96e" }}>[ STREAMING_CHANNELS ]</div>
        ) : (
          <>
            <h2 style={{ padding: "30px 32px 0", color: "#c9a96e", fontSize: "20px" }}>LIVE RADAR</h2>
            <div className="news-slider">
              {displayData.radar.map(n => (
                <div key={n.id} className="news-card" onClick={() => window.open(n.url, "_blank")}>
                  <img src={n.img} />
                  <div style={{ padding: "25px" }}>
                    <div style={{ color: "#c9a96e", fontWeight: "900", fontSize: "10px", marginBottom: "8px" }}>{n.kaynak.toUpperCase()}</div>
                    <h3 style={{ fontSize: "18px", margin: 0, lineHeight: "1.4" }}>{n.baslik}</h3>
                    <div style={{ color: "#4a6080", fontSize: "11px", marginTop: "15px" }}>{getRelativeTime(n.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ padding: "30px 32px 20px", color: "#4a6080", fontSize: "20px" }}>ARCHIVE</h2>
            <div className="archive-grid">
              {displayData.archive.map(n => (
                <div key={n.id} className="archive-card" onClick={() => window.open(n.url, "_blank")}>
                  <div style={{ color: "#c9a96e", fontWeight: "900", fontSize: "9px", marginBottom: "5px" }}>{n.kaynak.toUpperCase()}</div>
                  <h4 style={{ fontSize: "14px", margin: 0, fontWeight: "normal" }}>{n.baslik}</h4>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
