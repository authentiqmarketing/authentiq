module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  const url = body && body.url;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: 'Act as a curious content marketer that is well versed in B2B marketing. Create 9 interview questions for the business at the given website. Create 3 Top of Funnel, 3 Middle of Funnel, and 3 Bottom of Funnel questions. Return ONLY a JSON array of 9 strings, no preamble, no markdown.',
        messages: [{ role: 'user', content: 'Website: ' + url + '. Generate 9 interview questions.' }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error && data.error.message || 'API error', status: response.status });
    }

    const textBlock = data.content && data.content.find(function(b) { return b.type === 'text'; });
    if (!textBlock) {
      return res.status(500).json({ error: 'No response from model' });
    }

    var raw = textBlock.text.trim().replace(/```json|```/g, '').trim();
    var match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: 'Could not parse questions' });
    }

    var questions = JSON.parse(match[0]);
    return res.status(200).json({ questions: questions });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
