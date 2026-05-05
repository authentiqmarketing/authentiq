export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  try {
    const response = await fetch('https://blog.authentiqmarketing.com/rss.xml');
    const text = await response.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < 3) {
      const item = match[1];
      const title = (item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      let rawDesc = descMatch ? descMatch[1] : '';
      rawDesc = rawDesc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const imgMatch = rawDesc.match(/<img[^>]+src="([^"]+)"/);
      const image = imgMatch ? imgMatch[1] : '';
      let desc = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (desc.length > 120) desc = desc.slice(0, 120).replace(/\s+\S*$/, '') + '…';
      const date = new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      items.push({ title, link, desc, date, image });
    }
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch RSS' });
  }
}
