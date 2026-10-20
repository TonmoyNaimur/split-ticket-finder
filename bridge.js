window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || e.data.source !== "TSF_PAGE" || e.data.kind !== "gemini") return;
  const id = e.data.id;
  chrome.runtime.sendMessage({ type: "gemini", prompt: e.data.prompt }, (resp) => {
    const err = chrome.runtime.lastError;
    window.postMessage(
      { source: "TSF_BRIDGE", id, ...(err ? { ok: false, error: err.message } : resp) },
      "*"
    );
  });
});