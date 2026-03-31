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

const getRelativeTime = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} mins ago`;
  if (h < 24) return `${h} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
};

const SOURCE_LINKS = [
  { name: "Reuters", url: "https://www.reuters.com", color: "#FF8000" },
  { name: "Financial Times", url: "https://www.ft.com", color: "#FCD0B4" },
  { name: "Bloomberg HT", url: "https://www.bloomberght.com", color: "#E8E6E0" },
  { name: "The Economist", url: "https://www.economist.com", color: "#E3120B" },
  { name: "WSJ", url: "https://www.wsj.com", color: "#E8E6E0" },
  { name: "Gazete Oksijen", url: "https://gazeteoksijen.com", color: "#FFFFFF" },
  { name: "Euronews TR", url: "https://tr.euronews.com", color: "#005596" },
  { name: "NTV", url: "https://www.ntv.com.tr", color: "#FFE000" },
  { name: "Sözcü", url: "https://www.sozcu.com.tr", color: "#D92128" },
  { name: "Foreign Affairs", url: "https://www.foreignaffairs.com", color: "#5DADE2" },
  { name: "Nikkei Asia", url: "https://asia.nikkei.com", color: "#FFCC00" },
  { name: "SCMP", url: "https://www.scmp.com", color: "#FFD700" },
  { name: "Yonhap News", url: "https://en.yna.co.kr", color: "#C0392B" },
  { name: "Deutsche Welle", url: "https://www.dw.com", color: "#00ADFF" },
  { name: "France 24", url: "https://www.france24.com/en/", color: "#00AEEF" },
  { name: "Le Monde", url: "https://www.lemonde.fr/en/", color: "#FFFFFF" },
  { name: "El País", url: "https://elpais.com/global/", color: "#111111" },
  { name: "ANSA", url: "https://www.ansa.it/english/", color: "#0054A6" },
  { name: "Buenos Aires Times", url: "https://www.batimes.com.ar", color: "#74ACDF" },
  { name: "ABC Australia", url: "https://www.abc.net.au/news", color: "#FF5500" },
  { name: "Mail & Guardian", url: "https://mg.co.za", color: "#E00000" },
  { name: "ZeroHedge", url: "https://www.zerohedge.com", color: "#FFFFF0" },
  { name: "CNBC", url: "https://www.cnbc.com", color: "#00ACFF" },
  { name: "The Guardian", url: "https://www.theguardian.com", color: "#0582CA" },
  { name: "Dünya", url: "https://www.dunya.com", color: "#FF3333" },
  { name: "KAP", url: "https://www.kap.org.tr", color: "#00BFFF" },
  { name: "Para Analiz", url: "https://www.paraanaliz.com", color: "#E8E6E0" },
  { name: "Kitco", url: "https://www.kitco.com", color: "#00D46A" },
  { name: "Investing.com", url: "https://www.investing.com", color: "#F38B00" },
  { name: "BBC News", url: "https://www.bbc.com/news", color: "#EB3323" }
];

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

let persistentTimeCache = {};
try {
  const saved = localStorage.getItem('ww_time_cache');
  if (saved) persistentTimeCache = JSON.parse(saved);
} catch (e) {}

export default function GlobalHaberler() {
  const [newsPool, setNewsPool] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [activeTag, setActiveTag] = useState(GLOBAL_TAGS[0]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [modalType, setModalType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshBit, setRefreshBit] = useState(0);

  useEffect(() => {
    // GOOGLE SITE DOĞRULAMA (SADECE BU EKLENDI)
    let meta = document.querySelector('meta[name="google-site-verification"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "google-site-verification";
      document.head.appendChild(meta);
    }
    meta.content = "googleeea1c8719f042e0f";

    document.title = "WORLD WINDOWS";
    const setFavicon = () => {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = './logo.jpeg';
    };
    setFavicon();
    if (!document.cookie.includes('googtrans')) { document.cookie = "googtrans=/auto/en; path=/;"; }
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement({ 
          pageLanguage: 'auto', 
          includedLanguages: 'en,tr,es,de,fr,ar,zh-CN,ru,hi,ja,ko,th,kk,az,el,pt,cs,da,nl', 
          autoDisplay: false 
        }, 'google_translate_element');
      };
      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en";
      script.async = true;
      document.body.appendChild(script);
    }
    const styleInterval = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        if (combo.options && combo.options.length > 0 && combo.options[0].textContent !== 'SELECT') { combo.options[0].textContent = 'SELECT'; }
        if (combo.getAttribute('data-styled') !== 'true') {
          combo.setAttribute('data-styled', 'true');
          combo.style.cssText = "background-color: #c9a96e !important; color: #0d1424 !important; border: 1px solid #c9a96e !important; padding: 6px 12px !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 900 !important; cursor: pointer !important; outline: none !important; position: relative; top: -1px; width: auto; font-family: 'Source Sans 3', sans-serif; margin: 0 !important; height: 36px !important;";
        }
      }
    }, 500);
    return () => clearInterval(styleInterval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { fetchCollectiveNews(); return 60; } return prev - 1; });
      setRefreshBit(b => b + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTag]);

  useEffect(() => { fetchCollectiveNews(); setTimeLeft(60); }, [activeTag]);

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
            const newsId = btoa(unescape(encodeURIComponent(title.slice(0,50) + feedTitle)));
            if (!persistentTimeCache[newsId]) {
              persistentTimeCache[newsId] = Date.now();
              localStorage.setItem('ww_time_cache', JSON.stringify(persistentTimeCache));
            }
            const isTr = feedTitle.toLowerCase().match(/oksijen|sozcu|ntv|euronews|kap|dünya|dunya|bloomberg|para analiz/) || rawLink.includes('.tr');
            return { id: Math.random(), baslik: title, detay: (item.querySelector("description")?.textContent || "").replace(/<[^>]*>?/gm, ''), kaynak: feedTitle.replace(/ - BBC News| \| World/gi, ''), url: rawLink, img: `https://picsum.photos/seed/${encodeURIComponent(title.slice(0,5))}/800/450`, tagId: activeTag.id, timestamp: persistentTimeCache[newsId], lang: isTr ? "tr" : "en" };
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
      return { radar: [], archive: filtered };
    }
    const radar = []; const sourceCount = {};
    for (const item of filtered) {
      if (radar.length >= 40) break;
      if (!sourceCount[item.kaynak] || sourceCount[item.kaynak] < 3) {
        radar.push(item); sourceCount[item.kaynak] = (sourceCount[item.kaynak] || 0) + 1;
      }
    }
    return { radar, archive: filtered.filter(f => !radar.find(r => r.id === f.id)).slice(0, 500) };
  }, [newsPool, activeTag, searchTerm, refreshBit]);

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "#080c14", color: "#e8e6e0", fontFamily: "'Georgia', serif", overflowX: "hidden" }}>
      <div style={{ height: "60px", width: "100%", background: "#080c14" }}></div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Dancing+Script:wght@700&family=Source+Sans+3:wght@400;700&display=swap');
        .app-container { zoom: 0.8; }
        body { top: 0px !important; position: static !important; }
        .skiptranslate iframe, .goog-te-banner-frame { display: none !important; }
        #goog-gt-tt { display: none !important; }
        iframe.goog-te-menu-frame, .goog-te-balloon-frame, .goog-tooltip { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; border: none !important; }
        #google_translate_element > div:nth-child(1):nth-last-child(n+2) { opacity: 0 !important; position: absolute !important; pointer-events: none !important; z-index: -999 !important; }
        
        .radar-container { overflow-x: auto; display: flex; gap: 20px; padding: 20px 32px 40px; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; }
        .news-card { min-width: 400px; max-width: 400px; background: #0d1424; border: 1px solid #1e2d4a; border-radius: 12px; cursor: pointer; overflow: hidden; position: relative; scroll-snap-align: start; }
        .news-card img { width: 100%; height: 220px; object-fit: cover; border-bottom: 3px solid #c9a96e; pointer-events: none; }
        .time-badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: #c9a96e; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #c9a96e; z-index: 10; }
        
        .top-header-container { padding: 10px 32px; display: flex; align-items: center; justify-content: center; max-width: 1400px; margin: 0 auto; flex-wrap: wrap; }
        .tag-bar { display: flex; gap: 8px; overflow-x: auto; padding: 12px 32px; background: #0d1424; border-bottom: 1px solid #1e2d4a; position: sticky; top: 0; z-index: 100; -webkit-overflow-scrolling: touch; }
        .tag-pill { padding: 8px 16px; background: #080c14; border: 1px solid #1e2d4a; border-radius: 4px; color: #4a6080; font-size: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; text-transform: uppercase; font-family: 'Source Sans 3', sans-serif; }
        .tag-pill.active { background: #c9a96e; color: #080c14; }
        
        .archive-header { padding: 0 32px; margin-top: 30px; margin-bottom: 10px; max-width: 1400px; margin-left: auto; margin-right: auto; }
        .archive-header h2 { font-family: 'Dancing Script', cursive; font-size: 38px; color: #c9a96e; border-bottom: 1px solid #1e2d4a; padding-bottom: 10px; font-weight: 700; font-style: italic; }
        .archive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; padding: 32px; max-width: 1400px; margin: 0 auto; }
        .archive-card { background: #0d1424; border: 1px solid #1e2d4a; border-radius: 10px; padding: 25px; border-left: 4px solid #1e2d4a; cursor: pointer; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(8,12,20,0.96); z-index: 10000; display: flex; justify-content: center; align-items: center; }
        .modal-content { background: #0d1424; border: 1px solid #c9a96e; border-radius: 12px; width: 90vw; max-width: 700px; max-height: 80vh; overflow-y: auto; padding: 30px; position: relative; margin: auto; -webkit-overflow-scrolling: touch; box-shadow: 0 0 50px rgba(0,0,0,1); }
        
        .header-title { font-family: 'Playfair Display', serif; font-size: 82px; color: #c9a96e; font-weight: 900; margin: 0; line-height: 0.8; letter-spacing: -3px; text-transform: uppercase; }
        .slogan-text { font-family: 'Dancing Script', cursive; font-size: 24px; color: #c9a96e; margin-top: 8px; font-style: italic; }
        
        .main-slogan { font-family: 'Dancing Script', cursive; font-size: 24px; color: #c9a96e; font-weight: 700; letter-spacing: 0; line-height: 1.1; text-transform: uppercase; margin-top: 10px; }
        
        .search-area { padding: 32px; text-align: center; border-bottom: 1px solid #1e2d4a; margin-top: 20px; }
        .search-input { width: 100%; max-width: 650px; padding: 18px 25px; background: transparent; border: 2px solid #c9a96e; border-radius: 4px; color: #c9a96e; font-size: 18px; font-family: 'Source Sans 3', sans-serif; outline: none; margin-bottom: 20px; }
        
        .header-controls-row { display: flex; align-items: center; gap: 20px; justify-content: center; width: 100%; margin-top: 30px; border-top: 1px solid #1e2d4a; padding-top: 25px; height: 50px; }
        .sync-info { display: flex; align-items: center; gap: 15px; height: 36px; }

        @media (max-width: 768px) {
          .app-container { zoom: 1.0 !important; } 
          .header-title { font-size: 66px; }
          .header-controls-row { flex-direction: row; gap: 10px; padding-top: 20px; align-items: center; }
          .main-slogan { font-size: 24px; }
        }
      `}</style>
      <header style={{ background: "#0d1424" }}>
        <div className="top-header-container notranslate">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             <img src="./logo.jpeg" style={{ width: "135px", height: "135px", objectFit: "contain" }} />
             <div style={{ display: "flex", flexDirection: "column" }}>
               <h1 className="header-title">WORLD<br/>WINDOWS</h1>
               <div className="slogan-text">Global news to understand the world</div>
             </div>
          </div>
          <div className="header-controls-row">
             <div id="google_translate_element" style={{ display: "flex", alignItems: "center", height: "36px" }}></div>
             <div className="sync-info">
                <div style={{ fontSize: "14px", color: "#c9a96e", fontWeight: "bold", whiteSpace: "nowrap", display: "flex", alignItems: "center", height: "36px" }}>SYNC: {timeLeft}s</div>
                <button onClick={() => { fetchCollectiveNews(); setTimeLeft(60); }} style={{ background: "#c9a96e", color: "#0d1424", border: "none", padding: "0 25px", height: "36px", borderRadius: "4px", fontWeight: "900", cursor: "pointer", fontSize: "14px", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif" }}>SYNC NOW</button>
             </div>
          </div>
        </div>
        <div className="tag-bar notranslate">{GLOBAL_TAGS.map(t => (<div key={t.id} className={`tag-pill ${activeTag.id === t.id ? 'active' : ''}`} onClick={() => setActiveTag(t)}>#{t.label}</div>))}</div>
        <TradingViewLiveTicker />
      </header>
      <main>
        <div className="search-area notranslate">
          <input type="text" placeholder="Search news..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="main-slogan">ARE YOU READY TO DISCOVER THE WORLD...</div>
        </div>
        <div className="radar-container">
          {displayData.radar.map(n => (
            <div key={n.id} className="news-card" onClick={() => { setSelectedNews(n); setModalType('news'); }}>
              <div className="time-badge">{getRelativeTime(n.timestamp)}</div>
              <img src={n.img} />
              <div style={{ padding: "15px" }}>
                <div style={{ color: "#c9a96e", fontWeight: "900", fontSize: "10px" }}>{n.kaynak.toUpperCase()}</div>
                <h3 lang={n.lang} style={{ fontSize: "16px", color: "#e8e6e0", margin: "8px 0 0" }}>{n.baslik}</h3>
              </div>
            </div>
          ))}
        </div>
        <div className="archive-header notranslate">
          <h2>News Archive</h2>
        </div>
        <div className="archive-grid">
          {displayData.archive.map(n => (
            <div key={n.id} className="archive-card" onClick={() => { setSelectedNews(n); setModalType('news'); }}>
              <div style={{ fontSize: "10px", color: "#c9a96e", fontWeight: "900" }}>{n.kaynak.toUpperCase()} • {getRelativeTime(n.timestamp)}</div>
              <h4 lang={n.lang} style={{ fontSize: "15px", margin: "8px 0 0" }}>{n.baslik}</h4>
            </div>
          ))}
        </div>
      </main>
      <footer className="notranslate" style={{ padding: "40px", textAlign: "center", borderTop: "1px solid #1e2d4a", marginTop: "40px" }}>
        <div style={{ color: "#c9a96e", fontWeight: "900", marginBottom: "20px" }}>WORLD WINDOWS</div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px" }}>
          <span className="footer-link" onClick={() => setModalType('about')}>ABOUT US</span>
          <span className="footer-link" onClick={() => setModalType('privacy')}>PRIVACY</span>
          <span className="footer-link" onClick={() => setModalType('contact')}>CONTACT</span>
        </div>
        <div style={{ color: "#3a5278", fontSize: "10px", marginTop: "30px" }}>© 2026 World Windows Terminal. All Rights Reserved.</div>
      </footer>
      {modalType === 'news' && selectedNews && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "15px", right: "15px", background: "#c9a96e", border: "none", color: "#0d1424", width: "32px", height: "32px", borderRadius: "50%", fontSize: "18px", fontWeight: "bold", cursor: "pointer", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setModalType(null)}>✕</button>
            <img src={selectedNews.img} style={{ width: "100%", borderRadius: "8px", marginBottom: "20px" }} />
            <div style={{ color: "#c9a96e", fontWeight: "bold", fontSize: "14px" }}>{selectedNews.kaynak}</div>
            <h2 lang={selectedNews.lang} style={{ color: "#fff", margin: "12px 0", fontSize: "20px" }}>{selectedNews.baslik}</h2>
            <p lang={selectedNews.lang} style={{ color: "#e8e6e0", lineHeight: "1.6", fontSize: "15px", marginBottom: "20px" }}>{selectedNews.detay}</p>
            <div style={{ textAlign: "center" }}>
              <a href={selectedNews.url} target="_blank" rel="noreferrer" style={{ background: "#c9a96e", color: "#0d1424", padding: "12px 25px", textDecoration: "none", fontWeight: "bold", borderRadius: "4px", display: "inline-block", fontSize: "14px" }}>SOURCE ↗</a>
            </div>
          </div>
        </div>
      )}
      {modalType && modalType !== 'news' && (
        <div className="modal-overlay notranslate" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "15px", right: "15px", background: "#c9a96e", border: "none", color: "#0d1424", width: "32px", height: "32px", borderRadius: "50%", fontSize: "20px", fontWeight: "bold", cursor: "pointer", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setModalType(null)}>✕</button>
            <h2 style={{ color: "#c9a96e", fontFamily: "'Playfair Display'" }}>{modalType.toUpperCase()}</h2>
            <div style={{ color: "#8a9ab0", lineHeight: "1.8", marginTop: "15px" }}>
              {modalType === 'about' && (
                <>
                  <p>World Windows is a professional news terminal that scans global finance, geopolitics, and economy news. Our goal is to present the complex news flow on a single screen in its purest and fastest form.</p>
                  <div style={{ marginTop: "30px", borderTop: "1px solid #1e2d4a", paddingTop: "25px" }}>
                    <h3 style={{ color: "#c9a96e", fontSize: "16px", marginBottom: "15px", fontFamily: "'Playfair Display'" }}>GLOBAL SOURCES</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {SOURCE_LINKS.map(link => (
                        <a key={link.name} href={link.url} target="_blank" rel="noreferrer" style={{ color: link.color, textDecoration: "none", fontSize: "12px", border: `1px solid ${link.color}50`, padding: "6px 12px", borderRadius: "4px", background: "rgba(0,0,0,0.4)", fontWeight: "bold" }}>{link.name} ↗</a>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {modalType === 'contact' && <p>Email: worldwindows.network@gmail.com</p>}
              {modalType === 'privacy' && <p>We value your privacy. We use standard browser cookies for analytics and user experience.</p>}
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
