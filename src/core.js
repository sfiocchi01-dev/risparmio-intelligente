export const MAX = 1_000_000_000_000;
const fail = (message) => { throw new Error(message); };
const integer = (x, min = 0, max = MAX) => Number.isSafeInteger(x) && x >= min && x <= max;
export const total = s => s.goals.reduce((sum, g) => sum + g.balance, s.free);
export const euro = cents => new Intl.NumberFormat("it-IT", {style:"currency", currency:"EUR"}).format(cents / 100);
export function parseMoney(text) {
  const value = String(text).trim().replace(",", ".");
  if (value.length > 32 || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return result <= BigInt(MAX) ? Number(result) : null;
}
const isID = x => typeof x === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(x);
const validName = x => typeof x === "string" && x.trim().length > 0 && x.length <= 60;
const kinds = ["create", "edit", "priority", "deposit", "assign", "withdraw", "transfer", "delete", "withdrawFree"];
export function emptyState() { return {schema:1, revision:0, goals:[], free:0, priority:null, movements:[]}; }
export function validate(s) {
  if (!s || s.schema !== 1 || !integer(s.revision, 0, Number.MAX_SAFE_INTEGER - 1) ||
      !Array.isArray(s.goals) || s.goals.length > 1000 || !integer(s.free) ||
      !Array.isArray(s.movements) || s.movements.length > 100_000) fail("Archivio non valido o versione non supportata.");
  const ids = new Set();
  for (const g of s.goals) {
    if (!g || !isID(g.id) || ids.has(g.id) || !validName(g.name) ||
        !integer(g.target, 1) || !integer(g.balance, 0, g.target)) fail("Categoria non valida nel backup.");
    ids.add(g.id);
  }
  if (s.priority !== null && !ids.has(s.priority)) fail("Priorità non valida.");
  if (!integer(total(s))) fail("Il totale supera il limite del registro.");
  const movementIDs = new Set();
  for (const m of s.movements) {
    if (!m || !isID(m.id) || movementIDs.has(m.id) || !kinds.includes(m.kind) ||
        typeof m.text !== "string" || m.text.length > 1000 || !integer(m.amount) ||
        typeof m.date !== "string" || !/^\d{4}-\d\d-\d\dT/.test(m.date) ||
        !Number.isFinite(Date.parse(m.date))) fail("Movimento non valido nel backup.");
    movementIDs.add(m.id);
  }
  return s;
}
export function allocate(amount, goals, priority = null) {
  if (!integer(amount)) fail("Importo non valido.");
  validate({...emptyState(), goals, priority});
  const shares = Object.fromEntries(goals.map(g => [g.id, 0]));
  const working = goals.map(g => ({...g}));
  let remaining = amount;
  const first = working.find(g => g.id === priority);
  if (first) {
    const share = Math.min(remaining, first.target - first.balance);
    shares[first.id] += share; first.balance += share; remaining -= share;
  }
  const candidates = working.filter(g => g.balance < g.target).sort((a,b) => {
    const d = BigInt(a.balance)*BigInt(b.target) - BigInt(b.balance)*BigInt(a.target);
    return d === 0n ? a.id.localeCompare(b.id, "en") : d < 0n ? -1 : 1;
  });
  const budget = Math.min(remaining, candidates.reduce((sum,g) => sum+g.target-g.balance, 0));
  if (!budget) return {shares, free:remaining};
  let targets = 0n, balances = 0n;
  const active = [];
  for (let i=0; i<candidates.length; i++) {
    const g = candidates[i]; active.push(g);
    targets += BigInt(g.target); balances += BigInt(g.balance);
    const next = candidates[i+1];
    if (next && (BigInt(budget)+balances)*BigInt(next.target) > BigInt(next.balance)*targets) continue;
    break;
  }
  let assigned = 0;
  const remainders = active.map(g => {
    const numerator = (BigInt(budget)+balances)*BigInt(g.target) - BigInt(g.balance)*targets;
    const cents = Number(numerator / targets);
    shares[g.id] += cents; assigned += cents;
    return {id:g.id, value:numerator % targets};
  }).sort((a,b) => a.value === b.value ? a.id.localeCompare(b.id, "en") : a.value > b.value ? -1 : 1);
  for (let i=0; i<budget-assigned; i++) shares[remainders[i].id]++;
  return {shares, free:remaining-budget};
}
function money(x, positive = true) {
  if (!integer(x, positive ? 1 : 0)) fail("Inserisci un importo valido, maggiore di zero.");
}
export function apply(state, command, {now = new Date().toISOString(), id = crypto.randomUUID()} = {}) {
  validate(state);
  const s = structuredClone(state);
  let text = "", amount = command.amount ?? 0;
  const goal = goalID => s.goals.find(g => g.id === goalID) ?? fail("Categoria non trovata.");
  const distribute = (value, priority) => {
    const allocation = allocate(value, s.goals, priority);
    for (const g of s.goals) g.balance += allocation.shares[g.id];
    s.free += allocation.free;
    return allocation.free;
  };
  switch(command.type) {
    case "create": {
      const name = String(command.name ?? "").trim();
      const balance = command.balance ?? 0;
      money(command.target); money(balance, false);
      if (!validName(name) || balance > command.target || s.goals.length >= 1000) fail("Controlla nome, obiettivo e saldo iniziale.");
      s.goals.push({id:command.id ?? crypto.randomUUID(), name, target:command.target, balance});
      amount = balance; text = `Creato ${name} · saldo iniziale ${euro(balance)}`; break;
    }
    case "edit": {
      const g = goal(command.id), name = String(command.name ?? "").trim();
      money(command.target);
      if (!validName(name)) fail("Inserisci un nome da 1 a 60 caratteri.");
      const excess = Math.max(0, g.balance-command.target);
      s.free += excess; g.balance -= excess; g.name = name; g.target = command.target;
      amount = excess; text = `Modificato ${name} · obiettivo ${euro(g.target)}${excess ? ` · ${euro(excess)} da assegnare` : ""}`; break;
    }
    case "priority": {
      if (command.id !== null) goal(command.id);
      s.priority = command.id;
      text = command.id ? `Priorità a ${goal(command.id).name}` : "Priorità disattivata"; break;
    }
    case "deposit":
      money(amount); distribute(amount, s.priority);
      text = `Versamento · ${euro(amount)}`; break;
    case "assign":
      money(amount);
      if (amount > s.free) fail("Saldo da assegnare insufficiente.");
      s.free -= amount; distribute(amount, s.priority);
      text = `Distribuzione saldo libero · ${euro(amount)}`; break;
    case "withdraw":
    case "transfer": {
      money(amount);
      const source = goal(command.id);
      if (amount > source.balance) fail("Il prelievo supera il saldo disponibile.");
      if (command.type === "transfer") {
        const destination = goal(command.to);
        if (source.id === destination.id || amount > destination.target-destination.balance) fail("La destinazione non può ricevere questo importo.");
        destination.balance += amount;
        text = `Trasferimento · ${euro(amount)} da ${source.name} a ${destination.name}`;
      } else text = `Prelievo · ${euro(amount)} da ${source.name}`;
      source.balance -= amount; break;
    }
    case "withdrawFree":
      money(amount);
      if (amount > s.free) fail("Il prelievo supera il saldo da assegnare.");
      s.free -= amount; text = `Prelievo dal saldo libero · ${euro(amount)}`; break;
    case "delete": {
      const g = goal(command.id); amount = g.balance;
      if (!["redistribute", "withdraw"].includes(command.mode)) fail("Scegli come gestire il saldo.");
      s.goals = s.goals.filter(item => item.id !== g.id);
      if (s.priority === g.id) s.priority = null;
      if (command.mode === "redistribute") {
        const excess = distribute(g.balance, null);
        text = `Eliminato ${g.name} · ${euro(g.balance-excess)} redistribuiti · ${euro(excess)} da assegnare`;
      } else text = `Eliminato ${g.name} · prelevati ${euro(g.balance)}`;
      break;
    }
    default: fail("Operazione sconosciuta.");
  }
  s.movements.unshift({id, date:now, kind:command.type, text, amount});
  s.revision++;
  return validate(s);
}
export function backup(state) {
  validate(state);
  return JSON.stringify({app:"risparmio-intelligente", exportedAt:new Date().toISOString(), state}, null, 2);
}
export function readBackup(text) {
  if (typeof text !== "string" || text.length > 20_000_000) fail("Backup troppo grande (massimo 20 MB).");
  let data;
  try { data = JSON.parse(text); } catch { fail("Il file non contiene un backup JSON valido."); }
  if (data?.app !== "risparmio-intelligente") fail("Il file non è un backup di questa app.");
  validate(data.state);
  // Whitelist fields: never carry unknown imported properties into the app.
  return {schema:1, revision:data.state.revision, free:data.state.free, priority:data.state.priority,
    goals:data.state.goals.map(({id,name,target,balance})=>({id,name,target,balance})),
    movements:data.state.movements.map(({id,date,kind,text,amount})=>({id,date,kind,text,amount}))};
}
