/* Runs in the page's own context so it can see the game's own requests.
   It watches two things and never asks for anything itself:
     - building-furniture answers, so machines are known even without a refresh
     - the address of the game state call, because it carries the player id */
(() => {
  const FURN = /\/api\/building-furniture/;
  const GAME = /\/api\/game\/([0-9a-f-]{36})/i;

  const seen = (url, text) => {
    const g = GAME.exec(url);
    if (g) window.postMessage({ source: 'crfp-hook', playerId: g[1] }, '*');
    if (!FURN.test(url)) return;
    let data;
    try { data = JSON.parse(text); } catch { return; }
    const list = Array.isArray(data) ? data : data.furniture;
    if (Array.isArray(list)) {
      window.postMessage({ source: 'crfp-hook', url, furniture: list }, '*');
    }
  };

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    return origFetch.apply(this, args).then(res => {
      try {
        const url = res.url || String(args[0]);
        if (GAME.test(url)) seen(url, '');
        if (FURN.test(url)) res.clone().text().then(t => seen(url, t)).catch(() => {});
      } catch {}
      return res;
    });
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, url, ...rest) {
    this.__crfpUrl = url;
    return origOpen.call(this, m, url, ...rest);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', () => {
      try { seen(this.__crfpUrl || '', this.responseText || ''); } catch {}
    });
    return origSend.apply(this, args);
  };
})();
