(function () {
  const post = (record) =>
    window.postMessage({ source: "TSF_SNIFFER", record }, "*");

  const isStatic = (url) =>
    /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico|map)(\?|$)/i.test(url);

  const headersToObj = (h) => {
    const o = {};
    if (!h) return o;
    if (typeof Headers !== "undefined" && h instanceof Headers) {
      h.forEach((v, k) => (o[k] = v));
    } else if (Array.isArray(h)) {
      h.forEach(([k, v]) => (o[k] = v));
    } else {
      Object.assign(o, h);
    }
    return o;
  };

  // hide secrets so you can safely share the data
  const redact = (h) => {
    const out = {};
    for (const k in h) {
      out[k] = /authorization|cookie|token|csrf|key|device/i.test(k) ? "[HIDDEN]" : h[k];
    }
    return out;
  };

  // ---- watch fetch() ----
  const origFetch = window.fetch;
  window.fetch = async function (input, init) {
    const res = await origFetch.apply(this, arguments);
    try {
      const url = typeof input === "string" ? input : input.url || String(input);
      if (!isStatic(url)) {
        const method = (init && init.method) || (input && input.method) || "GET";
        const headers = headersToObj((init && init.headers) || (input && input.headers));
        const body = init && typeof init.body === "string" ? init.body : null;
        res.clone().text().then((text) => {
          post({
            kind: "fetch", url, method,
            headers: redact(headers), body,
            status: res.status,
            response: text.slice(0, 20000),
            time: new Date().toISOString(),
          });
        }).catch(() => {});
      }
    } catch (e) {}
    return res;
  };

  // ---- watch XMLHttpRequest ----
  const XO = XMLHttpRequest.prototype.open;
  const XS = XMLHttpRequest.prototype.send;
  const XH = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._tsf = { method, url: String(url), headers: {} };
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (this._tsf) this._tsf.headers[k] = v;
    return XH.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener("loadend", () => {
      try {
        if (!this._tsf || isStatic(this._tsf.url)) return;
        let text = "";
        try { text = this.responseText; } catch (e) { text = "[non-text response]"; }
        post({
          kind: "xhr",
          url: this._tsf.url,
          method: this._tsf.method,
          headers: redact(this._tsf.headers),
          body: typeof body === "string" ? body : null,
          status: this.status,
          response: (text || "").slice(0, 20000),
          time: new Date().toISOString(),
        });
      } catch (e) {}
    });
    return XS.apply(this, arguments);
  };
})();