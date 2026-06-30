export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  const { fn, args } = req.body || {};
  const scriptUrl = process.env.GS_SCRIPT_URL;
  const token = process.env.GS_API_TOKEN;

  if (!scriptUrl) return res.status(500).json({ ok: false, error: "Missing GS_SCRIPT_URL" });
  if (!token) return res.status(500).json({ ok: false, error: "Missing GS_API_TOKEN" });
  if (!fn) return res.status(400).json({ ok: false, error: "Missing fn" });

  let lastProblem = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const upstream = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fn, args: args || [] }),
      });

      const text = await upstream.text();

      try {
        const data = JSON.parse(text);
        return res.status(200).json(data);
      } catch {
        lastProblem = {
          status: upstream.status,
          contentType: upstream.headers.get("content-type"),
          snippet: text.slice(0, 500),
          attempt
        };
      }

    } catch (e) {
      lastProblem = {
        error: e.message || String(e),
        attempt
      };
    }

    await new Promise(resolve => setTimeout(resolve, 700 * attempt));
  }

  return res.status(502).json({
    ok: false,
    error: "Temporary backend problem. Please refresh and try again.",
    details: lastProblem
  });
}
