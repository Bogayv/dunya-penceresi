import { useState, useEffect } from "react";

export default function App() {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=finance&hl=en-US&gl=US&ceid=US:en")
      .then(res => res.json())
      .then(data => {
        if(data.status === "ok") setNews(data.items);
        else setError("Servis yanıt vermedi");
      })
      .catch(err => setError("Bağlantı hatası: " + err.message));
  }, []);

  return (
    <div style={{ padding: "50px", background: "#000", color: "#fff", fontFamily: "monospace" }}>
      <h1>SYSTEM TEST: WORLD WINDOWS</h1>
      <hr />
      {error && <div style={{ color: "red" }}>HATA: {error}</div>}
      {news.length === 0 && !error && <div>VERI BEKLENIYOR...</div>}
      <ul>
        {news.map((item, i) => (
          <li key={i} style={{ marginBottom: "15px" }}>
            <a href={item.link} target="_blank" style={{ color: "gold" }}>{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
