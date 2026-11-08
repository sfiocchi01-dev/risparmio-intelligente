# Preparazione e pubblicazione GitHub

## Stato attuale

Repository locale nella sola cartella web. Il proprietario ha comunicato di avere creato il repository remoto privato; il primo caricamento resta da completare. Nessun sito pubblicato da questa preparazione.

Nome concordato: **risparmio-intelligente**, proprietario **sfiocchi01-dev**. L'utente ha richiesto un repository **privato**: non creare repository pubblici né cambiare visibilità senza un nuovo consenso.

Il remoto locale origin punta a `https://github.com/sfiocchi01-dev/risparmio-intelligente.git`; questo non prova che il repository esista online o sia autenticato. L'identità autore usa il nome account e l'indirizzo noreply mostrato dal proprietario nelle impostazioni GitHub, senza pubblicare l'email personale.

GitHub Free consente repository privati, ma GitHub Pages da repository privati richiede un piano compatibile, come GitHub Pro. Inoltre la visibilità privata del repository non rende automaticamente privato un eventuale sito Pages. Per ora non pubblicare il sito; valutare piano o hosting separato mantenendo privato il codice.

## Prima del primo commit

1. Controllare i file con `git status --short` e `git diff --cached`.
2. Sono esclusi: dist generata, dipendenze/cache, file di backup, esportazioni calendario, credenziali, schermate dei test, istruzioni locali AGENTS e snapshot STATO-PROGETTO con percorsi personali.
3. Non aggiungere forzatamente questi file. Un backup con nome arbitrario potrebbe non essere intercettato dal gitignore: non copiarlo nella cartella del repository.
4. Scegliere nome ed email per i commit. Per non pubblicare l'email personale, usare esattamente l'indirizzo noreply mostrato in GitHub → Settings → Emails. Non inventare l'indirizzo.
5. Nessuna licenza scelta automaticamente. Prima di dichiarare il progetto open source scegliere una licenza esplicita con il proprietario.

Configurazione locale, da completare con i propri dati verificati:

```sh
git config user.name "NOME SCELTO"
git config user.email "INDIRIZZO NOREPLY FORNITO DA GITHUB"
git add .
git commit -m "Prima versione web di Risparmio intelligente"
```

## Creazione del remoto (passo successivo, non eseguito)

Su GitHub creare un repository **privato** vuoto con il nome concordato, verificando il proprietario e la visibilità prima di confermare. Non inizializzarlo con README, licenza o gitignore: i file sono già locali.

Dopo aver verificato l'URL del repository:

```sh
git remote -v
# origin è già configurato: non aggiungerlo una seconda volta.
git push -u origin main
```

L'autenticazione va gestita con gli strumenti GitHub o il gestore credenziali del Mac. Non inserire token nell'URL, nei file, nei comandi salvati o in chat. In alternativa usare GitHub Desktop, se già disponibile e configurato.

## GitHub Actions

- **Test e build**: parte a ogni push su main, pull request o avvio manuale. Node 24, test unitari, build e verifica dei soli asset pubblicabili. Nessuna dipendenza npm da scaricare.
- **Pubblica su GitHub Pages**: solo avvio manuale, solo ramo main; ripete test e controlli, carica esclusivamente dist/ e pubblica usando i permessi minimi Pages/OIDC. Non richiede token personale o secret configurato nel repository.
- I test browser restano un controllo separato: non vengono dichiarati eseguiti dal semplice workflow unitario.

## Prima pubblicazione, quando autorizzata

Non eseguire questo passaggio per il solo caricamento del repository privato. Prima verificare il piano Pages e ottenere il consenso separato alla pubblicazione del sito; non rendere pubblico il repository come scorciatoia.

1. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Actions → **Pubblica su GitHub Pages** → Run workflow, ramo main.
3. Attendere build e deploy verdi. L'URL effettivo compare nel job e nella sezione Pages; tipicamente `https://ACCOUNT.github.io/risparmio-intelligente/`.
4. Verificare su Safari/iPhone: installazione Home, versamento, chiusura/riapertura, backup e ripristino, offline e aggiornamento. Non registrare risparmi importanti prima di questa verifica.
5. Per ogni nuova release: commit/push esegue i controlli; la pubblicazione resta manuale. La cache è versionata dal contenuto della build.

## Dati dopo il deploy

Il registro locale su localhost non si trasferisce automaticamente al dominio GitHub. Esportare il backup dal vecchio indirizzo e importarlo nel nuovo, con conferma. Scegliere un URL stabile: cambiare account/repository/dominio o browser può cambiare il database visibile.

GitHub Pages serve solo file: nessun database cloud e nessuna sincronizzazione tra utenti. Solo codice fidato sullo stesso dominio. Il provider di hosting può registrare metadati di accesso; predisporre le informazioni privacy/supporto prima della diffusione ampia.
