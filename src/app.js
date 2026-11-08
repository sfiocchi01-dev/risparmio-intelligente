import {MAX, emptyState, total, euro, parseMoney, apply, backup, readBackup, validate} from "./core.js";
import {load, save} from "./storage.js";

const root = document.querySelector("#app");
const modal = document.querySelector("#modal");
const notice = document.querySelector("#notice");
const updateBanner = document.querySelector("#update-banner");
const colors = ["#9580e9", "#46b8b0", "#e8a65c", "#dd8ba7", "#7cace2"];
let state = emptyState(), ready = false, busy = false, historyLimit = 30, imported = null, noticeTimer;
let registration, waitingWorker, reloadOnUpdate = false;
let updateDismissed = false, updating = false, updateTimeout, lastUpdateCheck = 0;
function renderUpdateBanner() {
  updateBanner.hidden = !waitingWorker || updateDismissed;
  document.querySelector("#update-title").textContent = updating
    ? "Aggiornamento in corso…" : "È disponibile una nuova versione";
  document.querySelector("#update-description").textContent = busy
    ? "Salvataggio in corso. Potrai aggiornare al termine dell’operazione."
    : "Aggiorna quando preferisci. I risparmi già salvati rimangono sul dispositivo.";
  for (const control of document.querySelectorAll('[data-action="update"], [data-action="dismissUpdate"]')) {
    control.disabled = busy || updating || !waitingWorker;
  }
}
function setBusy(value) { busy = value; renderUpdateBanner(); }
function announceUpdate() {
  const next = registration?.waiting;
  if (next && next !== waitingWorker) updateDismissed = false;
  waitingWorker = next;
  renderUpdateBanner();
}
function requestUpdate() {
  if (!waitingWorker || busy || updating) return;
  updating = true; reloadOnUpdate = true; renderUpdateBanner();
  modal.close();
  const failed = () => {
    updating = false; reloadOnUpdate = false; announceUpdate();
    toast("L’aggiornamento non è stato attivato. Puoi riprovare; i dati salvati non sono stati modificati.");
  };
  updateTimeout = setTimeout(failed, 15_000);
  try { waitingWorker.postMessage({type:"ACTIVATE"}); }
  catch { clearTimeout(updateTimeout); failed(); }
}
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("risparmio-register:" + new URL("../", import.meta.url).pathname) : null;
const esc = x => String(x).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
const dateFormat = new Intl.DateTimeFormat("it-IT", {dateStyle:"long", timeStyle:"short"});
const goalFor = id => state.goals.find(g => g.id === id);
const button = (action, label, css="secondary", id="") => `<button type="button" class="${css}" data-action="${action}" ${id ? `data-id="${esc(id)}"` : ""}>${label}</button>`;
const amountField = (label="Importo in euro", name="amount", value="") => `<label for="${name}">${label}</label><input id="${name}" name="${name}" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" required value="${esc(value)}">`;
function pig(progress, index=0) {
  return `<div class="pig" aria-hidden="true" style="--pig:${colors[index % colors.length]};--fill:${Math.min(100,Math.max(0,progress))}%"><span class="pig-tail">〰</span><span class="pig-ear"></span><span class="pig-foot"></span><span class="pig-foot right"></span><span class="pig-body"><span class="pig-fill"></span><span class="pig-shine"></span></span><span class="pig-slot"></span><span class="pig-eye"></span><span class="pig-nose">••</span></div>`;
}
function toast(message) {
  clearTimeout(noticeTimer); notice.textContent = message; notice.hidden = false;
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 6000);
}
function render() {
  root.innerHTML = `<section class="intro"><div class="eyebrow">Ogni euro, una possibilità</div><h1>Piccoli risparmi.<br>Grandi progetti.</h1><p>Dai uno scopo ai soldi che metti da parte.</p></section>
    <section class="summary" aria-label="Riepilogo dei risparmi"><p>Totale risparmiato</p><div class="total" data-testid="total">${euro(total(state))}</div><div class="free-row"><span>Da assegnare</span><strong data-testid="free">${euro(state.free)}</strong></div>
    ${state.free > 0 ? `<div class="free-actions">${button("assign","Distribuisci saldo libero")}${button("withdrawFree","Preleva dal saldo libero")}</div>` : ""}</section>
    <section aria-labelledby="goals-title"><div class="section-heading"><h2 id="goals-title">I tuoi salvadanai</h2>${button("create","＋ Nuovo","add-small")}</div><div class="grid">${state.goals.length ? state.goals.map((g,i)=>`<button class="goal-card" data-action="detail" data-id="${esc(g.id)}" aria-label="${esc(g.name)}, ${euro(g.balance)} di ${euro(g.target)}${state.priority === g.id ? ', prioritario' : ''}">${pig(g.balance/g.target*100,i)}<span class="goal-name">${esc(g.name)}</span><span class="balance">${euro(g.balance)}</span><span class="target">di ${euro(g.target)}</span><span class="progress-text">${Math.floor(g.balance/g.target*100)}% riempito</span>${state.priority === g.id ? '<span class="badge">★ Prioritario</span>' : ''}</button>`).join("") : `<div class="empty">${pig(0)}<h3>Il tuo prossimo progetto parte da qui</h3><p>Crea il primo salvadanaio: auto, salute, vacanze…<br>Al resto della ripartizione pensiamo noi.</p>${button("create","Crea un salvadanaio","primary")}</div>`}</div></section>
    <hr class="section-divider"><section aria-labelledby="history-title"><div class="section-heading"><h2 id="history-title">Movimenti</h2><span class="muted">${state.movements.length} operazioni</span></div>${state.movements.length ? `<ol class="movement-list">${state.movements.slice(0,historyLimit).map(m=>`<li class="movement"><span class="movement-symbol" aria-hidden="true">${["withdraw","withdrawFree"].includes(m.kind) ? "↗" : m.kind === "deposit" ? "＋" : "↔"}</span><div><time datetime="${esc(m.date)}">${esc(dateFormat.format(new Date(m.date)))}</time><p>${esc(m.text)}</p></div></li>`).join("")}</ol>${state.movements.length>historyLimit ? button("more","Mostra altri movimenti","secondary history-more") : ""}` : '<p class="muted">Qui compariranno versamenti, prelievi e trasferimenti, con data e ora.</p>'}</section>
    <div class="status-line"><span><i class="dot"></i>Salvato su questo dispositivo</span><span>${navigator.onLine ? "Connessione disponibile" : "Sei offline"}</span>${button("settings","Backup e impostazioni","link-button")}</div><p class="footnote">È un registro virtuale: nessun collegamento bancario. I dati non sono sincronizzati online. Esporta regolarmente un backup.</p>`;
}
function openDialog(title, content, formType, id="") {
  modal.innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${esc(title)}</h2>${button("close","×","close")}</div>${formType ? `<form data-form="${formType}" data-id="${esc(id)}">${content}<p class="error" role="alert" id="form-error"></p></form>` : content}`;
  modal.querySelector(".close").setAttribute("aria-label", "Chiudi");
  if (!modal.open) modal.showModal();
}
const confirmButton = label => `<div class="form-actions"><button class="primary" type="submit">${label}</button>${button("close","Annulla")}</div>`;
function moneyDialog(type, id) {
  const g = goalFor(id);
  if (type === "deposit") openDialog("Aggiungi risparmi", `${amountField()}<p class="footnote">Prima la categoria prioritaria, poi quelle meno piene. Il denaro in eccesso resta da assegnare.</p>${confirmButton("Conferma versamento")}`,type);
  else if (type === "withdrawFree") openDialog("Preleva dal saldo libero", `<p>Disponibile: <strong>${euro(state.free)}</strong></p>${amountField()}<p class="footnote">Il prelievo riduce il totale senza toccare i salvadanai.</p>${confirmButton("Conferma prelievo")}`,type);
  else if (g) {
    const options = state.goals.filter(item=>item.id!==id).map(item=>`<option value="${esc(item.id)}">${esc(item.name)} · spazio ${euro(item.target-item.balance)}</option>`).join("");
    openDialog(type === "transfer" ? `Trasferisci da ${g.name}` : `Preleva da ${g.name}`, `<p>Disponibile: <strong>${euro(g.balance)}</strong></p>${amountField()}${type === "transfer" ? `<label for="to">Destinazione</label><select id="to" name="to" required>${options}</select>` : ""}${confirmButton(type === "transfer" ? "Conferma trasferimento" : "Conferma prelievo")}`,type,id);
  }
}
function categoryForm(type, id) {
  const g = goalFor(id);
  openDialog(type === "edit" ? "Modifica salvadanaio" : "Nuovo salvadanaio", `<label for="name">Nome categoria</label><input id="name" name="name" maxlength="60" required placeholder="Es. Vacanze" value="${esc(g?.name ?? '')}">${amountField("Obiettivo in euro","target",g ? (g.target/100).toFixed(2) : "")}${type === "create" ? amountField("Saldo iniziale in euro","balance","0") : '<p class="footnote">Riducendo l’obiettivo sotto il saldo, l’eccedenza torna da assegnare.</p>'}${confirmButton(type === "edit" ? "Salva modifiche" : "Crea salvadanaio")}`,type,id);
}
function detail(id) {
  const g = goalFor(id); if (!g) return;
  openDialog(g.name, `<div class="details-balance">${pig(g.balance/g.target*100,state.goals.indexOf(g))}<div class="balance">${euro(g.balance)}</div><p class="muted">Obiettivo ${euro(g.target)} · ${Math.floor(g.balance/g.target*100)}%</p></div><p class="footnote">${state.priority === id ? "★ Priorità attiva: riceve tutto fino al completamento, anche dopo un prelievo." : "La ripartizione favorisce i salvadanai meno pieni."}</p><div class="detail-actions">${button("withdraw","Preleva","secondary",id)}${button("transfer","Trasferisci","secondary",id)}${button("priority",state.priority === id ? "Disattiva priorità" : "★ Rendi prioritario","secondary wide",id)}${button("edit","Modifica categoria","secondary wide",id)}</div><hr class="separator">${button("delete","Elimina categoria","danger",id)}<p class="footnote">Il prelievo è solo una registrazione, non sposta denaro reale.</p>`);
}
function deleteDialog(id) {
  const g = goalFor(id); if (!g) return;
  openDialog(`Eliminare ${g.name}?`, `<p>Il saldo è <strong>${euro(g.balance)}</strong>. Scegli cosa farne:</p><div class="form-actions">${button("deleteRedistribute","Elimina e redistribuisci","danger",id)}<p class="footnote">Il totale non cambia. Le altre categorie si riempiono proporzionalmente senza priorità; l’eccedenza resta da assegnare.</p>${button("deleteWithdraw","Elimina e preleva tutto","danger",id)}<p class="footnote">Il totale diminuisce di ${euro(g.balance)}. I movimenti della categoria restano nello storico.</p>${button("close","Annulla")}</div><p class="error" role="alert" id="form-error"></p>`);
}
function settings() {
  openDialog("Il tuo registro, al sicuro", `<p class="install-note"><strong>Installala su iPhone</strong><br>Apri il sito in Safari → Condividi → Aggiungi alla schermata Home. Nessuna iscrizione o scadenza settimanale.</p><h3>Backup</h3><p class="footnote">I risparmi sono nel database di questo browser, non su GitHub. Cancellare i dati del sito può eliminarli. Il backup contiene dati personali in chiaro: conservalo in un luogo sicuro.</p>${button("export","↓ Esporta backup","primary")}<label for="backup-file">Ripristina da un backup JSON</label><input id="backup-file" type="file" accept=".json,application/json"><p class="footnote">Prima vedrai un riepilogo. Il ripristino sostituisce il registro attuale, non unisce i dati.</p><hr class="separator"><h3>Promemoria mensile</h3><p class="footnote">Questa versione non invia notifiche in background. Puoi aggiungere un evento ricorrente al tuo calendario, senza registrare versamenti automatici.</p><form data-form="calendar"><label for="day">Giorno del mese</label><input id="day" name="day" type="number" min="1" max="31" required value="1"><div class="form-actions"><button class="secondary" type="submit">Esporta promemoria calendario</button></div></form><hr class="separator"><h3>Spazio e modalità offline</h3><p class="footnote">Il primo accesso richiede Internet. L’app diventa disponibile offline quando i file sono stati memorizzati. Il sistema può comunque rimuovere dati locali: il backup resta importante.</p>${button("persist","Richiedi conservazione dei dati")}${waitingWorker ? `<div class="update">${button("update","Installa aggiornamento disponibile","primary")}</div>` : ""}<p class="error" role="alert" id="form-error"></p><p class="footnote">Nessun account, analytics, collegamento bancario o sincronizzazione cloud. Versione web 0.1.1.</p>`);
}
function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),30_000);
}
function exportBackup() { download(backup(state), `risparmio-${new Date().toISOString().replace(/[:.]/g,"-")}.backup.json`, "application/json"); }
async function commit(command) {
  if (busy) return;
  setBusy(true);
  const submit = modal.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
  try {
    const next = apply(state,command);
    await save(next,state.revision);
    state = next; modal.close(); render(); channel?.postMessage("changed"); toast("Operazione salvata sul dispositivo");
  } catch(error) {
    const field = modal.querySelector("#form-error");
    if (field) field.textContent = error.message; else toast(error.message);
  } finally { setBusy(false); if (submit) submit.disabled = false; }
}
async function refresh() {
  try { state = await load(); ready = true; render(); }
  catch(error) {
    ready = false;
    root.innerHTML = `<div class="read-only"><h1>Non riesco ad aprire il registro</h1><p>${esc(error.message)}</p><p>I dati non sono stati cancellati. Non usare la navigazione privata e verifica lo spazio disponibile.</p>${button("reload","Riprova","primary")}</div>`;
  }
}
function formAmount(data, name="amount") {
  const result = parseMoney(data.get(name));
  if (result === null) throw new Error("Usa importi in euro con al massimo due decimali, senza separatori delle migliaia.");
  return result;
}
document.addEventListener("submit", async event => {
  const form = event.target.closest("form[data-form]"); if (!form) return;
  event.preventDefault();
  if (busy || updating) return;
  const data = new FormData(form), type = form.dataset.form;
  try {
    if (type === "calendar") { exportCalendar(Number(data.get("day"))); return; }
    if (type === "restore") {
      if (!imported) throw new Error("Seleziona nuovamente il backup.");
      setBusy(true);
      try {
        const next = structuredClone(imported); next.revision = state.revision+1; validate(next);
        await save(next,state.revision);
        state = next; imported = null; modal.close(); render(); channel?.postMessage("changed"); toast("Backup ripristinato");
      } finally { setBusy(false); }
      return;
    }
    const command = {type,id:form.dataset.id};
    if (type === "create" || type === "edit") {
      command.name = data.get("name"); command.target = formAmount(data,"target");
      if (type === "create") { delete command.id; command.balance = formAmount(data,"balance"); }
    } else command.amount = formAmount(data);
    if (type === "transfer") command.to = data.get("to");
    await commit(command);
  } catch(error) {
    const field = modal.querySelector("#form-error"); if (field) field.textContent = error.message; else toast(error.message);
  }
});
document.addEventListener("click", async event => {
  const target = event.target.closest("button[data-action]"); if (!target) return;
  const {action,id} = target.dataset;
  if (action === "close") { if (!busy && !updating) modal.close(); return; }
  if (busy || updating) return;
  if (action === "reload") { await refresh(); return; }
  if (!ready) { toast("Attendi l’apertura del database locale."); return; }
  switch(action) {
    case "deposit": case "withdraw": case "transfer": case "withdrawFree": moneyDialog(action,id); break;
    case "create": case "edit": categoryForm(action,id); break;
    case "detail": detail(id); break;
    case "delete": deleteDialog(id); break;
    case "deleteRedistribute": await commit({type:"delete",id,mode:"redistribute"}); break;
    case "deleteWithdraw": await commit({type:"delete",id,mode:"withdraw"}); break;
    case "priority": await commit({type:"priority",id:state.priority === id ? null : id}); break;
    case "assign": await commit({type:"assign",amount:state.free}); break;
    case "export": exportBackup(); break;
    case "settings": settings(); break;
    case "more": historyLimit += 30; render(); break;
    case "persist": {
      try {
        const result = await navigator.storage?.persist?.();
        toast(result ? "Conservazione persistente concessa. Continua a fare backup." : "Il browser non ha concesso la conservazione persistente. Esporta regolarmente il backup.");
      } catch { toast("Richiesta non disponibile in questo browser. Usa il backup esportabile."); }
      break;
    }
    case "update": requestUpdate(); break;
    case "dismissUpdate": updateDismissed = true; renderUpdateBanner(); break;
  }
});
document.addEventListener("change", async event => {
  if (event.target.id !== "backup-file") return;
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 20_000_000) throw new Error("Backup troppo grande (massimo 20 MB).");
    imported = readBackup(await file.text());
    openDialog("Ripristinare questo backup?", `<p><strong>${imported.goals.length} categorie</strong> · ${imported.movements.length} movimenti</p><p>Totale: <strong>${euro(total(imported))}</strong><br>Da assegnare: ${euro(imported.free)}</p><p class="error">Il registro attuale verrà interamente sostituito. Esporta prima una copia se vuoi conservarlo.</p>${button("export","Esporta il registro attuale")}${confirmButton("Sostituisci e ripristina")}`,"restore");
  } catch(error) { const field = modal.querySelector("#form-error"); if (field) field.textContent = error.message; }
});
modal.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
modal.addEventListener("close", ()=> { imported = null; });
channel?.addEventListener("message", () => {
  if (busy || modal.open) toast("Registro aggiornato in un’altra scheda. Chiudi il modulo e ricarica prima di modificarlo.");
  else refresh();
});
window.addEventListener("online", ()=> { if (ready && !busy) render(); });
window.addEventListener("offline", ()=> { if (ready && !busy) render(); });
function exportCalendar(day) {
  if (!Number.isInteger(day) || day<1 || day>31) throw new Error("Scegli un giorno tra 1 e 31.");
  const next = new Date(); next.setHours(9,0,0,0);
  const actual = (y,m) => Math.min(day,new Date(y,m+1,0).getDate());
  next.setDate(actual(next.getFullYear(),next.getMonth()));
  if (next < new Date()) { next.setDate(1); next.setMonth(next.getMonth()+1); next.setDate(actual(next.getFullYear(),next.getMonth())); }
  const pad = n => String(n).padStart(2,"0");
  const start = `${next.getFullYear()}${pad(next.getMonth()+1)}${pad(next.getDate())}T090000`;
  const stamp = new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  download(["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Risparmio intelligente//IT","BEGIN:VEVENT",`UID:${crypto.randomUUID()}@risparmio-intelligente`,`DTSTAMP:${stamp}`,`DTSTART:${start}`,"DURATION:PT10M",`RRULE:FREQ=MONTHLY;BYMONTHDAY=${day},-1;BYSETPOS=1`,"SUMMARY:Conferma i tuoi risparmi mensili","DESCRIPTION:Apri Risparmio intelligente e registra il versamento solo se effettuato.","BEGIN:VALARM","TRIGGER:PT0M","ACTION:DISPLAY","DESCRIPTION:Ricorda di registrare i risparmi","END:VALARM","END:VEVENT","END:VCALENDAR",""].join("\r\n"),"promemoria-risparmio.ics","text/calendar");
}
await refresh();
if ("serviceWorker" in navigator) {
  try {
    registration = await navigator.serviceWorker.register(new URL("../sw.js",import.meta.url));
    const observeWorker = worker => worker?.addEventListener("statechange", announceUpdate);
    observeWorker(registration.installing);
    announceUpdate();
    registration.addEventListener("updatefound",()=> {
      observeWorker(registration.installing);
      announceUpdate();
    });
    const checkUpdate = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || busy || updating || Date.now()-lastUpdateCheck < 60_000) return;
      lastUpdateCheck = Date.now();
      registration.update().catch(()=> {});
    };
    document.addEventListener("visibilitychange", checkUpdate);
    window.addEventListener("pageshow", checkUpdate);
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange",()=> {
      if (reloading) return;
      clearTimeout(updateTimeout);
      announceUpdate();
      if (reloadOnUpdate) { reloading = true; location.reload(); }
      // Another tab may have activated the release: do not interrupt this tab's forms.
    });
  } catch { toast("Modalità offline non disponibile. I dati restano nel database locale: esporta un backup."); }
}
