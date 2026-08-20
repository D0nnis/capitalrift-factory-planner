/* Content script on the game page: injects the hook, notes the player id and
   anything the game loads by itself. */
const api = typeof browser !== 'undefined' ? browser : chrome;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig;

const s = document.createElement('script');
s.src = api.runtime.getURL('hook.js');
s.onload = () => s.remove();
(document.head || document.documentElement).appendChild(s);

/* Fallback discovery: ids the game left lying around. These are only
   candidates - the background worker tries them and keeps the one that
   answers, so a wrong guess costs nothing. */
function candidates() {
  const found = new Set();
  const add = t => { for (const m of String(t).matchAll(UUID)) found.add(m[0].toLowerCase()); };
  try { for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i); add(k); add(localStorage.getItem(k) ?? ''); } } catch {}
  try { for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i); add(k); add(sessionStorage.getItem(k) ?? ''); } } catch {}
  try { add(document.cookie); } catch {}
  return [...found].slice(0, 20);
}
setTimeout(async () => {
  const c = candidates();
  if (c.length) await api.storage.local.set({ candidates: c });
}, 2500);

let toastEl = null, toastTimer = null;
function toast(text) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    Object.assign(toastEl.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: 2147483647,
      background: '#1e1e1e', color: '#35dfa1', border: '1px solid #3d3d3d',
      borderRadius: '8px', padding: '10px 14px', font: '13px system-ui, sans-serif',
      boxShadow: '0 4px 18px rgba(0,0,0,.45)', pointerEvents: 'none', transition: 'opacity .3s'
    });
    document.body && document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (toastEl) toastEl.style.opacity = '0'; }, 2600);
}

window.addEventListener('message', async ev => {
  const d = ev.data;
  if (!d || d.source !== 'crfp-hook') return;

  if (d.playerId) {
    const cur = (await api.storage.local.get('playerId')).playerId;
    if (cur !== d.playerId) {
      await api.storage.local.set({ playerId: d.playerId });
      toast('Factory Planner: player recognised');
    }
    return;
  }
  if (!Array.isArray(d.furniture)) return;

  const store = await api.storage.local.get('furniture');
  const furniture = store.furniture || {};
  let added = 0;
  for (const f of d.furniture) {
    if (!f || !f.id) continue;
    if (!furniture[f.id]) added++;
    furniture[f.id] = { itemId: f.itemId, machineRecipe: f.machineRecipe || null };
  }
  if (!added) return;
  await api.storage.local.set({ furniture, updated: Date.now() });
  toast(`Factory Planner: ${Object.values(furniture).filter(x => x.machineRecipe).length} machines known`);
});
