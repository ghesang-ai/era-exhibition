/* ═══════════════════════════════════════════════════
   Netlify Function — Claude Proxy
   Reads Claude_Api_Key from Netlify Environment Variables.
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
      body: JSON.stringify({ error: { message: 'Claude API key tidak ditemukan di Netlify env var "Claude_Api_Key". Pastikan sudah disimpan dan redeploy.' } }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch(parseErr) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'Invalid JSON body: ' + parseErr.message } }),
    };
  }

  console.log('[claude-fn] model:', payload.model, '| key prefix:', apiKey.slice(0, 18) + '...');

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          apiKey.trim(),
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { data = { error: { message: 'Non-JSON from Anthropic: ' + text.slice(0, 200) } }; }

    console.log('[claude-fn] status:', upstream.status, '| response type:', data?.type);

    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('[claude-fn] fetch error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'Fetch error: ' + err.message } }),
    };
  }
};
