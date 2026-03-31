const { TwitterApi } = require('twitter-api-v2');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const RSS_FEEDS = [
  "https://www.ft.com/?format=rss",
  "https://www.bloomberght.com/rss",
  "https://www.reutersagency.com/feed/",
  "https://tr.euronews.com/rss?level=vertical&type=all"
];

const POSTED_FILE = path.join(__dirname, 'posted.json');

let postedUrls = [];
if (fs.existsSync(POSTED_FILE)) {
  try {
    postedUrls = JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'));
  } catch(e) { postedUrls = []; }
}

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const parser = new Parser();

async function runBot() {
  let allNews = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        if (item.link && !postedUrls.includes(item.link)) {
          allNews.push({
            title: item.title,
            link: item.link,
            source: (feed.title || "News").split(" - ")[0],
            date: new Date(item.isoDate || item.pubDate || Date.now()).getTime()
          });
        }
      });
    } catch (e) {}
  }

  allNews.sort((a, b) => b.date - a.date);
  const news = allNews[0];

  if (news) {
    try {
      const tweetText = `🔴 RADAR: ${news.source}\n\n${news.title}\n\nDetaylar: ${news.link}\n\nvia @metadoloji #GlobalNews`;
      await client.v2.tweet(tweetText);
      postedUrls.push(news.link);
      if (postedUrls.length > 500) postedUrls = postedUrls.slice(-500);
      fs.writeFileSync(POSTED_FILE, JSON.stringify(postedUrls, null, 2));
    } catch (error) {
      console.error(error);
    }
  }
}
runBot();
