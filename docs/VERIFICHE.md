# Verifiche — 8 novembre 2026

## Eseguite

- Node 26: `npm test`, 18 test passati.
- Cinque esempi di ripartizione della specifica iOS portati nel dominio web.
- 1.000 scenari generati: conservazione importi, nessun superamento obiettivi, indipendenza dall'ordine.
- UUID/ID stabili, priorità persistente, rounding, importi massimi, input malformati.
- Operazioni interne, eliminazione nelle due modalità, eccedenze, prelievo libero, modifica obiettivo.
- Backup roundtrip e timestamp, file/strutture/valori non validi, selezione dei campi noti.
- Build statica, percorsi relativi e manifest.

Playwright/Chromium, contesti isolati con soli dati sintetici:
- Flusso di creazione, versamento, prelievo, trasferimento, priorità e modifica obiettivo.
- Annullamento eliminazione e due modalità di eliminazione.
- Prelievo eccessivo respinto senza mutazioni, poi importo valido.
- Ricarica pagina e riapertura con dati e timestamp conservati.
- Download reale JSON confrontato con stato, errore su file non valido e ripristino confermato del backup.
- Scrittura obsoleta respinta.
- Eccezione di quota simulata durante put: transazione abortita, stato precedente invariato.
- Service worker controllante; rete disattivata, avvio offline, nuova categoria offline e dati presenti dopo reload.
- Viewport mobile 390×844 e desktop 1280×900, nessun overflow orizzontale.
- Percorso simulato GitHub Pages `/risparmio-intelligente/`, anche usando gli asset prodotti in dist.
- Screenshot mobile ispezionato con dati fittizi; correzione grafica dell'origine del livello di riempimento.

## Non ancora verificate

- Safari/WebKit su iPhone reale, Home Screen e installazione PWA.
- Persistenza dopo pressione di spazio/cancellazione dati o modalità privata.
- Esportazione, selezione file e importazione Calendario su iOS.
- Aggiornamento tra due release reali installate su iPhone.
- Accessibilità completa con VoiceOver e tastiera, stress test storico 100.000 operazioni.
- Dominio GitHub reale, configurazione repository e deploy. Nessuna pubblicazione eseguita.

## Riproducibilità

`tests/core.test.mjs` è eseguito da npm test.
`tests/browser.e2e.js` esporta un callback Playwright che richiede un contesto browser nuovo (registro vuoto), e svolge l'intero scenario.
`scripts/e2e.mjs` lo avvia quando Playwright è già disponibile. In questa sessione è stato eseguito dagli strumenti browser dell'ambiente senza installare dipendenze nel progetto.

Gli screenshot in tests/artifacts contengono esclusivamente esempi sintetici, non risparmi dell'utente.
