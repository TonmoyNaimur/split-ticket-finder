const msg = document.getElementById("msg");
chrome.storage.local.get("geminiKey", ({ geminiKey }) => {
  if (geminiKey) msg.textContent = "A key is saved.";
});
document.getElementById("save").onclick = () => {
  const v = document.getElementById("key").value.trim();
  if (!v) { msg.textContent = "Paste a key first."; return; }
  chrome.storage.local.set({ geminiKey: v }, () => {
    document.getElementById("key").value = "";
    msg.textContent = "Saved.";
  });
};
document.getElementById("clear").onclick = () =>
  chrome.storage.local.remove("geminiKey", () => (msg.textContent = "Key removed."));