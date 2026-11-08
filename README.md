# Risparmio intelligente

**Dai uno scopo a ogni euro che metti da parte.**

Risparmio intelligente è una web app che ti aiuta a organizzare i tuoi risparmi per obiettivi: un’auto, le vacanze, la salute, un fondo per gli imprevisti o qualsiasi altro progetto personale.

Invece di vedere un’unica somma indistinta, trovi un **salvadanaio trasparente per ogni categoria**, con il denaro già destinato a quell’obiettivo e quanto manca per raggiungerlo. Il riempimento visivo rende immediato capire a che punto sei.

È un **registro virtuale**, non un conto bancario: sei tu a registrare i soldi messi da parte o utilizzati. L’app li organizza, ma non custodisce né trasferisce denaro reale.

## Come funziona

1. **Crea i tuoi salvadanai.** Scegli il nome, l’importo da raggiungere e l’eventuale saldo iniziale.
2. **Registra un versamento.** L’app distribuisce la somma facendo recuperare prima gli obiettivi meno pieni, poi facendo crescere insieme le percentuali di riempimento.
3. **Scegli una priorità, se serve.** Un salvadanaio prioritario riceve tutto fino al completamento; solo l’eccedenza passa agli altri.
4. **Controlla e aggiorna i risparmi.** Apri un salvadanaio per registrare un prelievo, trasferire denaro a un altro obiettivo o modificarlo.
5. **Ritrova ogni operazione.** La lista dei movimenti mostra cosa è successo, con data e ora.

### Un esempio concreto

Hai due obiettivi inizialmente vuoti:

| Salvadanaio | Obiettivo | Quota di un versamento di 300 € | Riempimento |
|---|---:|---:|---:|
| Auto | 2.000 € | 200 € | 10% |
| Vacanze | 1.000 € | 100 € | 10% |

Le somme non vengono divise in parti uguali: vengono ripartite per far avanzare gli obiettivi alla **stessa percentuale**. Se una categoria è più indietro, i versamenti successivi la aiutano prima a recuperare.

I salvadanai completi non ricevono altro denaro. L’eventuale eccedenza resta nel **saldo da assegnare**, che puoi distribuire in seguito oppure prelevare direttamente.

## Cosa puoi fare

- Creare e modificare obiettivi di risparmio, senza scadenze obbligatorie.
- Registrare versamenti e lasciare all’app il calcolo della ripartizione.
- Attivare una categoria prioritaria e disattivarla quando vuoi.
- Registrare prelievi e trasferimenti tra salvadanai.
- Gestire il saldo non ancora distribuito.
- Eliminare una categoria scegliendo se redistribuire i risparmi o prelevarli tutti.
- Consultare lo storico dei movimenti con data e ora.
- Salvare automaticamente il registro sul dispositivo ed esportare o ripristinare un backup.
- Usare l’app offline dopo il primo caricamento e completamento della cache.
- Aggiungere un promemoria mensile al Calendario tramite un file esportabile, senza registrazioni automatiche.

## Come si usa

La web app si apre dal browser e, una volta ospitata in HTTPS, può essere aggiunta alla schermata Home dell’iPhone da Safari. Non richiede un account e non collega conti bancari. Il registro parte vuoto, pronto per i tuoi obiettivi.

### Apri l’app

**[Usa Risparmio intelligente](https://sfiocchi01-dev.github.io/risparmio-intelligente/)**

Su iPhone apri il link in **Safari → Condividi → Aggiungi alla schermata Home**. Il codice è disponibile nel repository pubblico; i risparmi rimangono nel database del tuo dispositivo, non su GitHub.

Per l’anteprima sul Mac segui le istruzioni qui sotto. Per gestire nuove pubblicazioni consulta [docs/GITHUB.md](docs/GITHUB.md).

## Avvio sul Mac

Serve Node.js 20+; non occorre installare pacchetti.

```sh
cd risparmio-intelligente
npm start
```

Apri **http://localhost:4173/** nel browser. Non aprire `index.html` con doppio clic: moduli, database e service worker richiedono un server.

Il server di anteprima ascolta solo sul Mac. `localhost` sull'iPhone identifica l'iPhone, non il Mac: sul telefono usa [l’indirizzo HTTPS pubblicato](https://sfiocchi01-dev.github.io/risparmio-intelligente/).

## Aggiornamenti

Quando il browser rileva una nuova versione, compare un **banner persistente** con due scelte:

- **Aggiorna ora**: attiva la nuova versione e ricarica l’app, conservando i risparmi già salvati.
- **Più tardi**: nasconde il banner per la sessione corrente; l’aggiornamento resta accessibile da **Backup e impostazioni** e l’avviso torna alla riapertura se la versione è ancora in attesa.

Il pulsante è disabilitato durante un salvataggio. Un aggiornamento avviato in una scheda non forza il riavvio delle altre schede con moduli aperti. La nuova versione può attivarsi automaticamente quando tutte le finestre precedenti vengono chiuse. Non serve reinstallare l’icona sulla Home.

Serve Internet per rilevare e scaricare le nuove versioni; offline rimane utilizzabile quella già disponibile. Il banner non è una notifica push e non richiede l’aggiornamento immediato.

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

Test aggiuntivi con tre release simulate verificano banner persistente, rinvio, attivazione, dati conservati e mancata interruzione di salvataggi/schede. Per riprodurli con Playwright disponibile: avviare `node tests/update-server.mjs` e, in un altro terminale, `npm run test:updates`. La fixture ascolta soltanto su localhost e non è inclusa nella build pubblicabile.

Il callback riproducibile è in `tests/browser.e2e.js`; `npm run test:browser` usa un'installazione **opzionale** di Playwright già disponibile nell'ambiente. Non è inclusa/installata dal progetto. Variabili: `TEST_URL` e `BROWSER=chromium|webkit|firefox`. Non attestiamo Safari o Firefox: finora i flussi sono stati eseguiti con Chromium, non su iPhone reale.

La build produce **`dist/`**, contenente soltanto gli asset pubblicabili; i file di sviluppo non vanno caricati come sito. Versione cache generata dal contenuto per mantenere coerenti HTML, CSS e moduli durante gli aggiornamenti. Anteprima della build:

```sh
PORT=4175 BASE_PATH=/risparmio-intelligente SERVE_DIST=1 npm start
```

Apri `http://localhost:4175/risparmio-intelligente/`. In sviluppo il service worker può mantenere una versione precedente: chiudi i moduli e installa l'aggiornamento dalle impostazioni. Non cancellare dati del sito per aggiornare un registro reale senza averne prima esportato il backup.

## Pubblicazione su GitHub Pages

I push e le pull request eseguono test e build; **non pubblicano automaticamente il sito**. Per pubblicare, configurare Pages con GitHub Actions e avviare manualmente il workflow «Pubblica su GitHub Pages», ramo main. Viene caricato soltanto `dist/`, dopo i controlli. Dettagli e procedura iniziale in [docs/GITHUB.md](docs/GITHUB.md).

Il repository deve contenere questa web app, non la cartella superiore dell'eventuale progetto nativo. Backup, documenti locali e schermate dei test sono esclusi dal versionamento.

Il sito è pubblicato e i flussi Chromium mobile/desktop sono stati verificati anche sull’indirizzo reale. Prima di usarlo con risparmi importanti o diffonderlo ampiamente, completare i test Safari/iPhone (installazione, chiusura/riapertura, offline, selezione file backup, esportazione e aggiornamento), verifica accessibilità e informazioni privacy/supporto. Su uno stesso dominio GitHub Pages, altri siti dello stesso proprietario condividono l'origine: pubblicare solo codice fidato.

## Struttura

- `index.html`, `styles.css`: interfaccia.
- `src/core.js`: dominio monetario puro, centesimi e prodotti esatti BigInt.
- `src/storage.js`: transazioni IndexedDB.
- `src/app.js`: presentazione e flussi.
- `sw.js`, `manifest.webmanifest`, `icons/`: PWA.
- `scripts/`: server, build, test browser e generazione icone.
- `tests/`: test del dominio, callback browser ed evidenze sintetiche.
- `docs/ARCHITETTURA.md`, `docs/VERIFICHE.md`: decisioni e collaudi.

## Documentazione

Le regole di funzionamento sono raccolte in [docs/SPECIFICA-WEB.md](docs/SPECIFICA-WEB.md); le scelte tecniche e le verifiche sono descritte nei documenti della cartella `docs/`.

Nessuna licenza di riutilizzo è stata ancora scelta: la visibilità pubblica del codice non equivale a una licenza open source.
