const api = typeof browser !== 'undefined' ? browser : chrome;
const PLANNER = 'https://d0nnis.github.io/capitalrift-factory-planner/';
const $ = id => document.getElementById(id);

async function paint() {
  const s = await api.storage.local.get(
    ['furniture', 'updated', 'buildingCount', 'playerId', 'manualPlayerId']);
  const all = Object.values(s.furniture || {});
  $('m').textContent = all.filter(x => x.machineRecipe).length;
  $('bl').textContent = s.buildingCount || 0;
  if (s.updated) $('upd').textContent = 'Last read ' + new Date(s.updated).toLocaleString();
  const id = s.manualPlayerId || s.playerId;
  $('pid').textContent = id ? (s.manualPlayerId ? 'set by hand: ' : 'detected: ') + id
                            : 'not detected yet — open Capital Rift once';
  if (s.manualPlayerId) $('manual').value = s.manualPlayerId;
}

$('refresh').addEventListener('click', async () => {
  const btn = $('refresh');
  btn.disabled = true; btn.textContent = 'Reading…';
  const res = await api.runtime.sendMessage({ kind: 'refresh' });
  btn.disabled = false; btn.textContent = 'Read my factory';
  $('upd').textContent = (res && res.message) || 'Done.';
  paint();
});
$('open').addEventListener('click', () => api.tabs.create({ url: PLANNER }));
$('save').addEventListener('click', async () => {
  const v = $('manual').value.trim().toLowerCase();
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (v && !re.test(v)) { $('pid').textContent = 'That does not look like an id.'; return; }
  await api.storage.local.set({ manualPlayerId: v || null });
  paint();
});
$('clear').addEventListener('click', async () => {
  await api.storage.local.clear();
  $('upd').textContent = 'Cleared.';
  $('manual').value = '';
  paint();
});
paint();
