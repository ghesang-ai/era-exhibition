/* ═══════════════════════════════════════════════════
   Netlify Function — Claude Proxy
   Reads CLAUDE_API_KEY from Netlify Environment Variables.
   Frontend calls /.netlify/functions/claude  (same origin → no CORS issue)
   ═══════════════════════════════════════════════════ */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.Claude_Api_Key;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'Claude API key belum dikonfigurasi di Netlify Environment Variables.' } }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: err.message } }),
    };
  }
};
