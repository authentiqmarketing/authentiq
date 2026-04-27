export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = req.query && req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key', hasKey: false });

  // Test: return early with what we have before calling Anthropic
  return res.status(200).json({ 
    received: url, 
    keyLength: apiKey.length,
    keyStart: apiKey.substring(0, 10)
  });
}
