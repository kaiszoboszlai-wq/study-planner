export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POSTで送信してください。' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'サーバーにGEMINI_API_KEYが設定されていません。Vercelの環境変数を確認してください。' });
  const { system, messages } = req.body || {};
  if (typeof system !== 'string' || !Array.isArray(messages) || messages.length < 1)
    return res.status(400).json({ error: '相談内容の形式が正しくありません。' });
  const safeMessages = messages.slice(-10).filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content.slice(0, 6000) }] }));
  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== 'user')
    return res.status(400).json({ error: '相談内容を入力してください。' });
  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system.slice(0, 6000) }] },
        contents: safeMessages,
        generationConfig: { maxOutputTokens: 700, temperature: 0.7 }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Gemini API error:', response.status, data?.error?.message || '');
      if (response.status === 400 || response.status === 404) return res.status(502).json({ error: 'AIモデル名またはリクエストに問題があります。VercelのGEMINI_MODEL設定を確認してください。' });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ error: 'APIキーが無効か、APIの利用が許可されていません。Google AI Studioのキー設定を確認してください。' });
      if (response.status === 429) return res.status(429).json({ error: '無料枠の上限またはレート制限に達しました。時間をおいて再試行してください。' });
      return res.status(502).json({ error: 'AIへの問い合わせに失敗しました。APIの利用状況を確認してください。' });
    }
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();
    if (!text) return res.status(502).json({ error: 'AIから回答が返りませんでした。もう一度試してください。' });
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini request failed:', error?.message || error);
    return res.status(502).json({ error: 'AIサーバーに接続できませんでした。少し待って再試行してください。' });
  }
}
