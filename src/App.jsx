import { useState, useEffect, useRef, memo, useMemo } from "react";

const GLOBAL_TAGS = [
  { id: "all", label: "TÜMÜ", query: "finance+world+news" },
  { id: "ekonomi", label: "EKONOMİ", query: "global+economy+markets" },
  { id: "finans", label: "FİNANS", query: "wall+street+fed+investing" },
  { id: "jeopolitik", label: "JEOPOLİTİK", query: "geopolitics+intelligence+war" },
  { id: "borsa", label: "BORSA", query: "stock+market+live+sp500" },
  { id: "kripto", label: "KRİPTO", query: "crypto+bitcoin+news" },
];

const Ticker = memo(() => {
  const container = useRef();
  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "OANDA:XAUUSD", "title": "GOLD" },
        { "proName": "FX:USDTRY", "title": "USD/TRY" },
        { "proName": "BINANCE:BTCUSDT", "title": "BTC" },
        { "proName": "TVC:UKOIL", "title": "BRENT" }
      ],
      "colorTheme": "dark", "isTransparent": false, "displayMode": "regular", "locale": "tr", "backgroundColor": "#000000"
    });
    container.current.appendChild(script);
  }, []);
  return <div style={{ borderBottom: "1px solid #1e2d4a" }} ref={container}></div>;
});

export default function GlobalHaberler() {
  const [newsPool, setNewsPool] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState(GLOBAL_TAGS[0]);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { fetchNews(); }, [activeTag]);

  async function fetchNews() {
    setLoading(true);
    try {
      // YENİ YÖNTEM: AllOrigins üzerinden doğrudan Google News XML'ini çekiyoruz (Limit yok!)
      const googleRss = `https://news.google.com/rss/search?q=${activeTag.query}&hl=en-US&gl=US&ceid=US:en`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(googleRss)}`;
      
      const res = await fetch(proxyUrl);
      const wrapper = await res.json();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(wrapper.contents, "text/xml");
      const items = Array.from(xmlDoc.querySelectorAll("item"));
      
      const processed = items.map((item, index) => ({
        id: item.querySelector("guid")?.textContent || index,
        title: item.querySelector("title")?.textContent,
        link: item.querySelector("link")?.textContent,
        source: item.querySelector("source")?.textContent || "Global",
        pubDate: item.querySelector("pubDate")?.textContent,
        timestamp: new Date(item.querySelector("pubDate")?.textContent).getTime(),
        img: `https://picsum.photos/seed/${encodeURIComponent((item.querySelector("title")?.textContent || "news").slice(0,5))}/800/450`
      }));

      setNewsPool(processed.sort((a,b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Haber alma hatası");
    }
    setLoading(false);
  }

  const displayData = useMemo(() => ({
    radar: newsPool.slice(0, 8),
    archive: newsPool.slice(8, 60)
  }), [newsPool]);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8e6e0", fontFamily: "serif" }}>
      <header style={{ background: "#0d1424", padding: "20px 32px", borderBottom: "1px solid #1e2d4a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ color: "#c9a96e", margin: 0, fontSize: "26px", letterSpacing: "3px", fontWeight: "900" }}>WORLD WINDOWS</h1>
          <div style={{ color: "#c9a96e", fontWeight: "bold", fontSize: "12px" }}>SYNC: {timeLeft}s</div>
        </div>
      </header>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "12px 32px", background: "#0d1424", borderBottom: "1px solid #1e2d4a" }}>
        {GLOBAL_TAGS.map(t => (
          <button key={t.id} onClick={() => setActiveTag(t)} style={{
            padding: "6px 16px", background: activeTag.id === t.id ? "#c9a96e" : "#080c14",
            color: activeTag.id === t.id ? "#0d1424" : "#4a6080", border: "1px solid #1e2d4a", cursor: "pointer", fontSize: "10px", fontWeight: "900", borderRadius: "4px"
          }}>#{t.label}</button>
        ))}
      </div>

      <Ticker />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px" }}>
        {loading && newsPool.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px", color: "#c9a96e", letterSpacing: "3px" }}>[ SYSTEM_REBOOTING_DATA_STREAM ]</div>
        ) : (
          <>
            <h2 style={{ color: "#c9a96e", fontSize: "18px", marginBottom: "20px", borderLeft: "4px solid #c9a96e", paddingLeft: "15px" }}>LIVE RADAR</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px", marginBottom: "50px" }}>
              {displayData.radar.map(n => (
                <div key={n.id} onClick={() => window.open(n.link, "_blank")} style={{ background: "#0d1424", border: "1px solid #1e2d4a", borderRadius: "12px", overflow: "hidden", cursor: "pointer", transition: "0.3s" }}>
                  <img src={n.img} style={{ width: "100%", height: "200px", objectFit: "cover", borderBottom: "2px solid #c9a96e" }} />
                  <div style={{ padding: "20px" }}>
                    <div style={{ color: "#c9a96e", fontSize: "10px", fontWeight: "900", marginBottom: "10px" }}>[{n.source.toUpperCase()}]</div>
                    <h3 style={{ fontSize: "16px", margin: 0, lineHeight: "1.4" }}>{n.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ color: "#4a6080", fontSize: "18px", marginBottom: "20px", borderLeft: "4px solid #1e2d4a", paddingLeft: "15px" }}>ARCHIVE</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "15px" }}>
              {displayData.archive.map(n => (
                <div key={n.id} onClick={() => window.open(n.link, "_blank")} style={{ background: "#0d1424", border: "1px solid #1e2d4a", padding: "15px", borderRadius: "8px", cursor: "pointer" }}>
                  <div style={{ color: "#c9a96e", fontSize: "9px", fontWeight: "900", marginBottom: "5px" }}>{n.source}</div>
                  <h4 style={{ fontSize: "14px", margin: 0, color: "#e8e6e0", fontWeight: "normal" }}>{n.title}</h4>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={{ padding: "40px", textAlign: "center", background: "#0d1424", borderTop: "1px solid #1e2d4a", color: "#1e2d4a", fontSize: "12px" }}>
        WORLDWINDOWS.NETWORK // © 2026
      </footer>
    </div>
  );
}
