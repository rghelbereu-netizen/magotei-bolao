export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "POST only" });
    return;
  }

  const SCRIPT_URL = process.env.GS_SCRIPT_URL;   // your Apps Script /exec
  const TOKEN = process.env.GS_API_TOKEN;         // must match API_TOKEN in Code.gs

  try {
    const payload = req.body || {};
    const upstream = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, token: TOKEN })
    });

    const text = await upstream.text();

    // Pass through JSON if possible
    try {
      const json = JSON.parse(text);
      res.status(200).json(json);
    } catch {
      res.status(200).send(text);
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
