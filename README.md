# Risparmio intelligente — Web app

Web app installabile (PWA) per dare uno scopo ai risparmi. Registro personale in euro, senza collegamenti bancari, account o server applicativo.

Repository predisposto per GitHub; pubblicazione del sito manuale tramite GitHub Actions. Istruzioni in [docs/GITHUB.md](docs/GITHUB.md).

## Avvio sul Mac

Serve Node.js 20+; non occorre installare pacchetti.

```sh
cd risparmio-intelligente
npm start
```

Apri **http://localhost:4173/** nel browser. Non aprire `index.html` con doppio clic: moduli, database e service worker richiedono un server.

Il server di anteprima ascolta solo sul Mac. `localhost` sull'iPhone identifica l'iPhone, non il Mac. L'installazione reale su iPhone richiederà un indirizzo HTTPS, che predisporremo su GitHub Pages; non è ancora pubblicato.

## Funzioni implementate

- Registro inizialmente vuoto, senza dati dimostrativi mescolati ai propri risparmi.
- Salvadanai trasparenti responsive, nome, saldo, obiettivo e percentuale.
- Creazione e modifica categorie; saldo iniziale registrato.
- Versamenti con ripartizione che allinea le percentuali più basse; una priorità persistente.
- Prelievi, trasferimenti e saldo da assegnare.
- Pulsante di prelievo libero sotto quello di distribuzione.
- Eliminazione con scelta esplicita: redistribuzione senza priorità o prelievo totale; annullamento.
- Movimenti con data/ora originali e separatore rispetto ai salvadanai.
- Salvataggio automatico in IndexedDB, confermato soltanto quando la transazione è completata.
- Esportazione/importazione backup JSON, con validazione, riepilogo e conferma di sostituzione.
- Shell offline con service worker, manifest e icone per installazione.
- Richiesta facoltativa di conservazione persistente al browser, non garantita.
- Esportazione di un promemoria mensile per il Calendario (file ICS), non notifiche web automatiche.

## Dati e backup

Dati locali, non inviati a GitHub o a un server applicativo. Nessun account, analytics o collegamento bancario. Il database è associato all'origine e al percorso dell'app: cambiare dominio/percorso/browser può far apparire un registro vuoto. Non significa che i dati siano stati trasferiti o cancellati.

**Esporta regolarmente un backup dalle impostazioni.** Cancellare i dati del sito, alcune modalità private o la gestione dello spazio del sistema possono far perdere il database. Il backup è in chiaro: non inserirlo nel repository pubblico. Il ripristino sostituisce l'intero registro, non fa un merge; esporta prima la versione attuale.

Le modifiche da schede concorrenti vengono serializzate con controllo di revisione: in caso di conflitto l'operazione viene rifiutata, non sovrascrive dati più recenti. Questo non è sincronizzazione tra dispositivi.

## Test e build

```sh
npm test
npm run build
npm run check:dist
```

18 test unitari Node passati, inclusi i cinque esempi approvati e 1.000 scenari generati. Nessuna dipendenza esterna per eseguirli.

Test browser Playwright eseguiti tramite gli strumenti dell'ambiente: flussi completi mobile 390×844 e desktop 1280×900, persistenza, backup reale scaricato/ripristinato, file malformato, operazione eccessiva, conflitto tra revisioni, errore di scrittura simulato e avvio/salvataggio offline. Verificati anche sotto `/risparmio-intelligente/`, come un repository GitHub Pages.

Il callback riproducibile è in `tests/browser.e2e.js`; `npm run test:browser` usa un'installazione **opzionale** di Playwright già disponibile nell'ambiente. Non è inclusa/installata dal progetto. Variabili: `TEST_URL` e `BROWSER=chromium|webkit|firefox`. Non attestiamo Safari o Firefox: finora i flussi sono stati eseguiti con Chromium, non su iPhone reale.

La build produce **`dist/`**, contenente soltanto gli asset pubblicabili; i file di sviluppo non vanno caricati come sito. Versione cache generata dal contenuto per mantenere coerenti HTML, CSS e moduli durante gli aggiornamenti. Anteprima della build:

```sh
PORT=4175 BASE_PATH=/risparmio-intelligente SERVE_DIST=1 npm start
```

Apri `http://localhost:4175/risparmio-intelligente/`. In sviluppo il service worker può mantenere una versione precedente: chiudi i moduli e installa l'aggiornamento dalle impostazioni. Non cancellare dati del sito per aggiornare un registro reale senza averne prima esportato il backup.

## Pubblicazione su GitHub Pages

I push e le pull request eseguono test e build; **non pubblicano automaticamente il sito**. Per pubblicare, configurare Pages con GitHub Actions e avviare manualmente il workflow «Pubblica su GitHub Pages», ramo main. Viene caricato soltanto `dist/`, dopo i controlli. Dettagli e procedura iniziale in [docs/GITHUB.md](docs/GITHUB.md).

Il repository deve contenere questa web app, non la cartella superiore dell'eventuale progetto nativo. Backup, documenti locali e schermate dei test sono esclusi dal versionamento.

Prima della pubblicazione: test Safari/iPhone (installazione, chiusura/riapertura, offline, selezione file backup, esportazione e aggiornamento), verifica accessibilità e pagina informativa. Su uno stesso dominio GitHub Pages, altri siti dello stesso proprietario condividono l'origine: pubblicare solo codice fidato.

## Struttura

- `index.html`, `styles.css`: interfaccia.
- `src/core.js`: dominio monetario puro, centesimi e prodotti esatti BigInt.
- `src/storage.js`: transazioni IndexedDB.
- `src/app.js`: presentazione e flussi.
- `sw.js`, `manifest.webmanifest`, `icons/`: PWA.
- `scripts/`: server, build, test browser e generazione icone.
- `tests/`: test del dominio, callback browser ed evidenze sintetiche.
- `docs/ARCHITETTURA.md`, `docs/VERIFICHE.md`: decisioni e collaudi.

## Limiti rispetto alla versione nativa prevista

Niente iCloud, sincronizzazione cloud, login o notifiche push in background. Il promemoria Calendario richiede importazione e autorizzazioni nel calendario scelto; nessun versamento viene registrato automaticamente. Il registro è locale e non è un servizio bancario.

Regole della versione web in [docs/SPECIFICA-WEB.md](docs/SPECIFICA-WEB.md). La versione nativa eventualmente presente nella cartella superiore non è parte di questo repository.

Nessuna licenza di riutilizzo è stata ancora scelta: la visibilità pubblica del codice non equivale a una licenza open source.
