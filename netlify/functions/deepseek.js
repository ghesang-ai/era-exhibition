/* ═══════════════════════════════════════════════════
   Netlify Function — DeepSeek Proxy
   Reads DEEPSEEK_API_KEY from Netlify Environment Variables.
   Frontend calls /.netlify/functions/deepseek  (same origin → no CORS issue)
   ═══════════════════════════════════════════════════ */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.DeepSeek_API_Key;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'DeepSeek API key belum dikonfigurasi di Netlify Environment Variables.' } }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type':  'application/json',
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
