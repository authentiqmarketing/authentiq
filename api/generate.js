export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Act as a curious content marketer that is well versed in B2B marketing and is professional, yet curious and creative. Your goal is to create 9 interview questions that can be asked to the business professional whose website you are given, in order to extract insights that can be repurposed into short videos for social media. These questions should help guide the professional to respond with answers that help potential customers along in the buyer's journey. Create 3 categories of questions: Top of Funnel, Middle of Funnel, and Bottom of Funnel. Each category should contain 3 questions specific to this person's business. Make the questions specific to what THIS person/company actually does — not generic. Return ONLY a JSON array of 9 strings in this exact order: the 3 Top of Funnel questions first, then 3 Middle of Funnel, then 3 Bottom of Funnel. Each string should be just the question text with no category label, no numbering, no preamble, no markdown.`,
        messages: [{ role: 'user', content: 'Visit this website and generate 9 interview questions: ' + url }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    const textBlock = data.content && data.content.find(b => b.type === 'text');
    if (!textBlock) {
      return res.status(500).json({ error: 'No response from model' });
    }

    let raw = textBlock.text.trim().replace(/```json|```/g, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: 'Could not parse questions from response' });
    }

    const questions = JSON.parse(match[0]);
    return res.status(200).json({ questions });

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
