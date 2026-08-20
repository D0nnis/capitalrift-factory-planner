/* Content script on the planner page: hands over what is stored and relays
   refresh requests to the background worker. */
const api = typeof browser !== 'undefined' ? browser : chrome;

async function push(extra) {
  const store = await api.storage.local.get(['furniture', 'updated', 'buildings']);
  const furniture = Object.entries(store.furniture || {})
    .map(([id, v]) => ({ id, itemId: v.itemId, machineRecipe: v.machineRecipe }));
  window.postMessage({
    source: 'crfp-extension', kind: 'furniture',
    furniture,
    buildings: Object.keys(store.buildings || {}).length,
    updated: store.updated || null,
    ...(extra || {})
  }, '*');   // same window only; "null" origin on file:// would throw
}

window.addEventListener('message', async ev => {
  if (ev.source !== window) return;
  const d = ev.data;
  if (!d || d.source !== 'crfp-page') return;
  if (d.kind === 'request') return push();
  if (d.kind === 'refresh') {
    const res = await api.runtime.sendMessage({ kind: 'refresh' });
    return push({ refresh: res });
  }
});

push();
api.storage.onChanged.addListener(() => push());
