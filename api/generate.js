export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = req.query && req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key' });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-latest',
        max_tokens: 1000,
        system: 'You are a B2B content strategist. Generate exactly 9 interview questions for the business at the given URL. Return ONLY a valid JSON array of 9 strings. No other text.',
        messages: [{ role: 'user', content: 'Generate 9 interview questions for: ' + url }]
      })
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) return res.status(500).json({ error: 'Anthropic error', detail: data });

    const textBlock = data.content && data.content.find(b => b.type === 'text');
    if (!textBlock) return res.status(500).json({ error: 'No text in response', data });

    const raw = textBlock.text.trim().replace(/```json|```/g, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return res.status(500).json({ error: 'No JSON array found', raw: raw.substring(0, 300) });

    const questions = JSON.parse(match[0]);
    return res.status(200).json({ questions });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
