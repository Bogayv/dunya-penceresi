import { useState, useEffect, useRef, memo, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";

const GLOBAL_TAGS = [
  { id: "all", label: "ALL", urls: [] },
  { id: "trump", label: "TRUMP", urls: ["https://www.reutersagency.com/feed/", "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml", "https://www.politico.com/rss/politicopicks.xml"]},
  { id: "war", label: "WAR", urls: ["https://www.aljazeera.com/xml/rss/all.xml", "https://www.theguardian.com/world/rss", "http://feeds.bbci.co.uk/news/world/rss.xml"]},
  { id: "ekonomi", label: "ECONOMY", urls: ["https://www.ft.com/?format=rss", "https://www.economist.com/sections/economics/rss.xml", "https://www.wsj.com/xml/rss/3_7014.xml", "https://www.forbes.com/economics/feed/"]},
  { id: "finans", label: "FINANCE", urls: ["https://www.wsj.com/xml/rss/3_7031.xml", "https://www.cnbc.com/id/10000664/device/rss/rss.html", "https://feeds.barrons.com/v1/barrons/rss?xml=1", "https://www.ft.com/markets?format=rss"]},
  { id: "kripto", label: "CRYPTO", urls: ["https://cointelegraph.com/rss", "https://www.coindesk.com/arc/outboundfeeds/rss/"]},
  { id: "asya", label: "ASIA PACIFIC", urls: ["https://www.scmp.com/rss/4/feed", "https://asia.nikkei.com/rss/feed/category/53", "https://en.yna.co.kr/RSS/news.xml"]},
  { id: "jeopolitik", label: "GEOPOLITICS", urls: ["https://tr.euronews.com/rss?level=vertical&type=all", "https://www.france24.com/en/rss", "https://www.foreignaffairs.com/rss.xml", "https://rss.dw.com/rdf/rss-en-all", "https://www.theguardian.com/world/rss", "https://www.aljazeera.com/xml/rss/all.xml"]},
  { id: "siyaset", label: "POLITICS", urls: ["https://www.sozcu.com.tr/feeds-son-dakika", "https://www.politico.com/rss/politicopicks.xml", "https://www.theguardian.com/politics/rss", "https://www.abc.net.au/news/feed/45910/rss.xml"]},
  { id: "gold", label: "GOLD", urls: ["https://www.kitco.com/rss/index.xml", "https://www.investing.com/rss/news_95.rss"]},
  { id: "borsa", label: "MARKETS", urls: ["https://www.bloomberght.com/rss", "https://gazeteoksijen.com/rss", "https://www.paraanaliz.com/feed/", "https://www.ntv.com.tr/ekonomi.rss"]},
  { id: "kap", label: "KAP & CORP", urls: ["https://www.kap.org.tr/tr/rss", "https://www.paraanaliz.com/feed/", "https://www.dunya.com/rss"]},
];

const ALL_URLS = Array.from(new Set(GLOBAL_TAGS.flatMap(tag => tag.urls)));

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
        { "proName": "BINANCE:BTCUSDT", "title": "BTC" },
        { "proName": "BINANCE:ETHUSDT", "title": "ETH" },
        { "proName": "OANDA:XAUUSD", "title": "GOLD" },
        { "proName": "OANDA:XAGUSD", "title": "SILVER" },
        { "proName": "FX:EURUSD", "title": "EUR/USD" },
        { "proName": "FX:USDTRY", "title": "USD/TRY" }
      ],
      "showSymbolLogo": true, "colorTheme": "dark", "isTransparent": false, "displayMode": "regular", "locale": "en", "backgroundColor": "#000000"
    });
    container.current.appendChild(script);
  }, []);
  return <div style={{ background: "#000", borderBottom: "1px solid #1e2d4a", minHeight: "46px" }} ref={container}></div>;
});

export default function GlobalHaberler() {
  const [newsPool, setNewsPool] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [activeTag, setActiveTag] = useState(GLOBAL_TAGS[0]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [modalType, setModalType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "WORLD WINDOWS";
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { fetchCollectiveNews(); return 60; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTag]);

  useEffect(() => { fetchCollectiveNews(); setTimeLeft(60); }, [activeTag]);

  useEffect(() => {
    if (newsPool.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const nid = params.get('newsId');
      if (nid) {
        const found = newsPool.find(n => n.id === nid);
        if (found) { setSelectedNews(found); setModalType('news'); }
      }
    }
  }, [newsPool]);

  async function fetchCollectiveNews() {
    try {
      const targetUrls = activeTag.id === "all" ? ALL_URLS : activeTag.urls;
      const fetchPromises = targetUrls.map(async (url) => {
        try {
          const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
          if (!res.ok) return [];
          const xmlText = await res.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const items = Array.from(xmlDoc.querySelectorAll("item, entry")).slice(0, 15);
          const feedTitle = xmlDoc.querySelector("channel > title, feed > title")?.textContent || "Global";
          return items.map(item => {
            const title = item.querySelector("title")?.textContent || "News";
            const linkElem = item.querySelector("link");
            let rawLink = (linkElem?.textContent || linkElem?.getAttribute("href") || "#").trim();
            const nId = btoa(unescape(encodeURIComponent(title.slice(0,10)))).replace(/[^a-zA-Z0-9]/g, "").slice(0,12);
            return { id: nId, baslik: title, detay: (item.querySelector("description")?.textContent || "").replace(/<[^>]*>?/gm, ''), kaynak: feedTitle.replace(/ - BBC News| \| World/gi, ''), url: rawLink, tagId: activeTag.id, timestamp: Date.now() };
          });
        } catch (e) { return []; }
      });
      const results = await Promise.all(fetchPromises);
      setNewsPool(results.flat().sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {}
  }

  const displayData = useMemo(() => {
    let filtered = activeTag.id === "all" ? newsPool : newsPool.filter(i => i.tagId === activeTag.id);
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(i => i.baslik.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return { archive: filtered.slice(0, 100) };
  }, [newsPool, activeTag, searchTerm]);

  // İŞTE SENİN İSTEDİĞİN DOĞRUDAN TWEET ATMA FONKSİYONU
  const directShareToX = (e, n) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?newsId=${n.id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(n.baslik)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const openModalWithLink = (n) => {
    setSelectedNews(n);
    setModalType('news');
    window.history.pushState({}, '', `?newsId=${n.id}`);
  };

  const closeModal = () => {
    setModalType(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "#080c14", color: "#e8e6e0", fontFamily: "'Georgia', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Source+Sans+3:wght@400;700&display=swap');
        .app-container { zoom: 0.8; }
        .tag-bar { display: flex; gap: 8px; overflow-x: auto; padding: 12px 32px; background: #0d1424; border-bottom: 1px solid #1e2d4a; position: sticky; top: 0; z-index: 100; }
        .tag-pill { padding: 8px 16px; background: #080c14; border: 1px solid #1e2d4a; border-radius: 4px; color: #4a6080; font-size: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; text-transform: uppercase; font-family: 'Source Sans 3', sans-serif; }
        .tag-pill.active { background: #c9a96e; color: #080c14; }
        .archive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 32px; max-width: 1400px; margin: 0 auto; }
        .archive-card { background: #0d1424; border: 1px solid #1e2d4a; border-radius: 10px; padding: 25px; border-left: 4px solid #1e2d4a; cursor: pointer; position: relative; transition: 0.3s; }
        .archive-card:hover { border-color: #c9a96e; }
        .share-icon-mini { position: absolute; bottom: 15px; right: 15px; color: #4a6080; font-size: 18px; transition: 0.2s; background: none; border: none; cursor: pointer; }
        .share-icon-mini:hover { color: #c9a96e; transform: scale(1.1); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(8,12,20,0.96); z-index: 10000; display: flex; justify-content: center; align-items: center; }
        .modal-content { background: #0d1424; border: 1px solid #c9a96e; border-radius: 12px; width: 90vw; max-width: 700px; max-height: 80vh; overflow-y: auto; padding: 40px; position: relative; }
        .btn-x-share { color: #fff; border: 1px solid #c9a96e; padding: 12px 25px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Source Sans 3', sans-serif; transition: 0.2s; background: #000; font-size: 16px; }
        .btn-x-share:hover { background: #c9a96e !important; color: #000 !important; }
      `}</style>
      
      <header style={{ background: "#0d1424" }}>
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "72px", color: "#c9a96e", margin: 0, letterSpacing: "-2px" }}>
            WORLD WINDOWS <span style={{ fontSize: "20px", color: "#4a6080", verticalAlign: "middle" }}>v2</span>
          </h1>
          <div style={{ color: "#4a6080", fontStyle: "italic", fontSize: "18px", marginTop: "10px" }}>Global perspective, instant intelligence</div>
          <div style={{ color: "#c9a96e", fontWeight: "bold", fontSize: "12px", marginTop: "15px" }}>SYNC: {timeLeft}s</div>
        </div>
        <div className="tag-bar">{GLOBAL_TAGS.map(t => (<div key={t.id} className={`tag-pill ${activeTag.id === t.id ? 'active' : ''}`} onClick={() => setActiveTag(t)}>#{t.label}</div>))}</div>
        <TradingViewLiveTicker />
      </header>

      <main>
        <div style={{ padding: "32px", textAlign: "center" }}>
          <input type="text" placeholder="Search news..." style={{ width: "100%", maxWidth: "650px", padding: "18px", background: "transparent", border: "2px solid #c9a96e", color: "#c9a96e", borderRadius: "4px", outline: "none" }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="archive-grid">
          {displayData.archive.map(n => (
            <div key={n.id} className="archive-card" onClick={() => openModalWithLink(n)}>
              <div style={{ fontSize: "10px", color: "#c9a96e", fontWeight: "900", marginBottom: "8px" }}>{n.kaynak.toUpperCase()}</div>
              <h4 style={{ fontSize: "16px", color: "#fff", lineHeight: "1.4", margin: 0 }}>{n.baslik}</h4>
              <button className="share-icon-mini" title="Doğrudan X'te Paylaş" onClick={(e) => directShareToX(e, n)}>𝕏</button>
            </div>
          ))}
        </div>
      </main>

      {modalType === 'news' && selectedNews && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#c9a96e", fontSize: "24px", cursor: "pointer" }} onClick={closeModal}>✕</button>
            <div style={{ color: "#c9a96e", fontWeight: "bold", fontSize: "12px", marginBottom: "10px" }}>{selectedNews.kaynak.toUpperCase()}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", color: "#fff", margin: "0 0 20px" }}>{selectedNews.baslik}</h2>
            <p style={{ color: "#e8e6e0", lineHeight: "1.8", fontSize: "16px", marginBottom: "30px" }}>{selectedNews.detay}</p>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "40px", borderTop: "1px solid #1e2d4a", paddingTop: "25px" }}>
              <button className="btn-x-share" onClick={(e) => directShareToX(e, selectedNews)}>
                <span>𝕏</span> TWEET AT (SHARE ON X)
              </button>
              <a href={selectedNews.url} target="_blank" style={{ background: "#c9a96e", color: "#000", padding: "12px 20px", borderRadius: "6px", fontWeight: "bold", textDecoration: "none", display: "flex", alignItems: "center", fontFamily: "'Source Sans 3', sans-serif" }}>ORİJİNAL KAYNAĞI OKU ↗</a>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
