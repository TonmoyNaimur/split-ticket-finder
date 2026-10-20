// Change this name if Google retires it (see aistudio.google.com for current model names)
const MODEL = "gemini-2.5-flash";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "gemini") return;
  (async () => {
    try {
      const { geminiKey } = await chrome.storage.local.get("geminiKey");
      if (!geminiKey) throw new Error("No Gemini key saved. Click the extension icon and save your key.");
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: msg.prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0 },
          }),
        }
      );
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || "HTTP " + r.status);
      const cand = (j.candidates && j.candidates[0]) || {};
      const parts = (cand.content && cand.content.parts) || [];
      sendResponse({ ok: true, text: parts.map((p) => p.text || "").join("") });
    } catch (e) {
      sendResponse({ ok: false, error: String(e.message || e) });
    }
  })();
  return true;
});