/**
 * Reads the whole factory on demand.
 *
 * The game state at /api/game/<playerId> carries `landHoldings`, and every
 * holding has a `chunkId` plus a `buildings` list of refs. Those two values are
 * exactly what /api/building-furniture wants, so one call to the game state is
 * enough to know every building without the player clicking through them.
 *
 * Host permissions make these fetches carry the player's own session cookie and
 * exempt them from page CORS. Read-only, own account only, and only when asked.
 */
const api = globalThis.browser ?? globalThis.chrome;
const ORIGIN = 'https://play.capitalrift.com';

async function playerId() {
  const s = await api.storage.local.get(['playerId', 'manualPlayerId', 'candidates']);
  // A hand-typed id wins: if discovery ever guesses wrong, the player can
  // override it and the wrong guess never becomes sticky.
  if (s.manualPlayerId) return [s.manualPlayerId];
  const list = [];
  if (s.playerId) list.push(s.playerId);
  for (const c of s.candidates || []) if (!list.includes(c)) list.push(c);
  return list;
}

async function fetchGame() {
  const ids = await playerId();
  if (!ids.length) return { error: 'No player id yet. Open Capital Rift once so the extension can pick it up, or type it into the popup.' };
  for (const id of ids) {
    let res;
    try {
      res = await fetch(`${ORIGIN}/api/game/${encodeURIComponent(id)}`, { credentials: 'include' });
    } catch (e) {
      return { error: `Could not reach Capital Rift: ${e.message}` };
    }
    if (res.status === 401 || res.status === 403) {
      return { error: 'Capital Rift did not accept the request — open the game and sign in, then try again.' };
    }
    if (!res.ok) continue;                 // wrong id, try the next candidate
    let game;
    try { game = await res.json(); } catch { continue; }
    if (!game || !game.playerId) continue; // "not your player" and friends
    await api.storage.local.set({ playerId: id });
    return { game };
  }
  return { error: 'None of the known player ids worked. Type yours into the popup.' };
}

function buildingsOf(game) {
  const out = [];
  for (const h of game.landHoldings || []) {
    if (!h || !h.chunkId || !Array.isArray(h.buildings)) continue;
    for (const ref of h.buildings) {
      if (typeof ref === 'string' && ref) out.push({ ref, chunk: h.chunkId });
    }
  }
  return out;
}

async function refresh() {
  const { game, error } = await fetchGame();
  if (error) return { ok: false, message: error };

  const list = buildingsOf(game);
  if (!list.length) {
    return { ok: false, message: 'No buildings found on your land holdings.' };
  }

  // A full read replaces what was stored rather than adding to it, so machines
  // you tore down disappear instead of haunting the numbers.
  const furniture = {};
  let done = 0, machines = 0, failed = 0;
  for (const b of list) {
    const url = `${ORIGIN}/api/building-furniture?ref=${encodeURIComponent(b.ref)}`
              + `&chunk=${encodeURIComponent(b.chunk)}`;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { failed++; continue; }
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.furniture;
      if (!Array.isArray(items)) { failed++; continue; }
      done++;
      for (const f of items) {
        if (!f || !f.id) continue;
        furniture[f.id] = { itemId: f.itemId, machineRecipe: f.machineRecipe || null };
        if (f.machineRecipe) machines++;
      }
    } catch { failed++; }
  }

  const inventory = {};
  for (const row of game.inventory || []) {
    if (!row || typeof row !== 'object') continue;
    const key = row.itemId ?? row.key ?? row.id;
    const qty = Number(row.qty ?? row.quantity ?? row.amount ?? 0);
    if (key && Number.isFinite(qty)) inventory[key] = qty;
  }

  await api.storage.local.set({
    furniture, inventory, buildingCount: done, updated: Date.now()
  });
  return {
    ok: true,
    message: `${done} building${done === 1 ? '' : 's'} read, ${machines} machines found`
      + (failed ? `, ${failed} could not be reached` : '') + '.'
  };
}

api.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg && msg.kind === 'refresh') { refresh().then(respond); return true; }
});
