export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

  try {
    const { fn, args } = req.body || {};
    const scriptUrl = process.env.GS_SCRIPT_URL;
    const token = process.env.GS_API_TOKEN;

    if (!scriptUrl) return res.status(500).json({ ok: false, error: "Missing GS_SCRIPT_URL" });
    if (!token) return res.status(500).json({ ok: false, error: "Missing GS_API_TOKEN" });
    if (!fn) return res.status(400).json({ ok: false, error: "Missing fn" });

    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, fn, args: args || [] }),
    });

    const text = await upstream.text();

    // Try JSON parse, otherwise return snippet to diagnose
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(502).json({
        ok: false,
        error: "Apps Script returned HTML/not-JSON. Fix doPost/deploy/access/URL.",
        status: upstream.status,
        contentType: upstream.headers.get("content-type"),
        snippet: text.slice(0, 500)
      });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}
