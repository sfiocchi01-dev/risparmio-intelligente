import {emptyState, validate} from "./core.js";

let connection;
export function openStore() {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open("risparmio-intelligente:" + new URL("../", import.meta.url).pathname, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("register");
    request.onerror = () => reject(new Error("Impossibile aprire il salvataggio locale. Verifica le impostazioni del browser."));
    request.onblocked = () => reject(new Error("Chiudi le altre schede dell’app e riprova."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = null; };
      resolve(db);
    };
  });
  return connection;
}
export async function load() {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("register", "readonly");
    const request = tx.objectStore("register").get("state");
    let state;
    request.onsuccess = () => { state = request.result ?? emptyState(); };
    tx.oncomplete = () => {
      try { resolve(validate(state)); } catch (error) { reject(error); }
    };
    tx.onabort = tx.onerror = () => reject(new Error("Lettura dei dati non riuscita. Nessun dato è stato sovrascritto."));
  });
}
export async function save(next, expectedRevision) {
  validate(next);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || next.revision !== expectedRevision + 1) {
    throw new Error("Revisione del salvataggio non valida.");
  }
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("register", "readwrite");
    const store = tx.objectStore("register");
    let reason;
    const request = store.get("state");
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== expectedRevision) {
        reason = new Error("I dati sono cambiati in un’altra scheda. Ricarica prima di riprovare: nessuna modifica è stata sovrascritta.");
        tx.abort();
        return;
      }
      try { store.put(next, "state"); }
      catch { reason = new Error("Salvataggio non riuscito. Nessuna modifica applicata: verifica lo spazio disponibile."); tx.abort(); }
    };
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(reason ?? new Error("Salvataggio non riuscito. L’operazione non è stata applicata: controlla lo spazio disponibile."));
  });
}
