# Preparazione e pubblicazione GitHub

## Stato attuale

Repository locale nella sola cartella web, remoto `sfiocchi01-dev/risparmio-intelligente`, ramo `main`. Creato inizialmente privato, è stato reso **pubblico su successiva autorizzazione esplicita dell'utente**, insieme alla prima pubblicazione del sito.

- Codice: https://github.com/sfiocchi01-dev/risparmio-intelligente
- App: https://sfiocchi01-dev.github.io/risparmio-intelligente/
- Prima pubblicazione: workflow Pages `42483134969`, build e deploy superati (18 test unitari, build e controllo asset).
- Verificati otto asset HTTPS byte per byte rispetto alla build locale e i flussi Chromium mobile/desktop sul sito reale, anche offline e con backup. Safari/iPhone fisico resta da collaudare.

Nome concordato: **risparmio-intelligente**, proprietario **sfiocchi01-dev**. Non cambiare nuovamente visibilità, dominio o modalità di pubblicazione senza consenso.

Il remoto locale origin punta a `https://github.com/sfiocchi01-dev/risparmio-intelligente.git`; il repository è stato verificato online come privato, con proprietario e nome corretti, prima e dopo il primo push. L'identità autore usa il nome account e l'indirizzo noreply mostrato dal proprietario nelle impostazioni GitHub, senza pubblicare l'email personale.

La combinazione corrente è repository pubblico e GitHub Pages su GitHub Free. Il sito e il codice sono pubblicamente accessibili; i dati degli utenti restano locali. Nessun servizio Cloudflare è stato configurato.

## Prima del primo commit

1. Controllare i file con `git status --short` e `git diff --cached`.
2. Sono esclusi: dist generata, dipendenze/cache, file di backup, esportazioni calendario, credenziali, schermate dei test, istruzioni locali AGENTS e snapshot STATO-PROGETTO con percorsi personali.
3. Non aggiungere forzatamente questi file. Un backup con nome arbitrario potrebbe non essere intercettato dal gitignore: non copiarlo nella cartella del repository.
4. Scegliere nome ed email per i commit. Per non pubblicare l'email personale, usare esattamente l'indirizzo noreply mostrato in GitHub → Settings → Emails. Non inventare l'indirizzo.
5. Licenza scelta esplicitamente dal proprietario: GPLv3, versione 3 soltanto (`GPL-3.0-only`), testo ufficiale in LICENSE. Non sostituirla con AGPL o altre licenze senza consenso. I dati/backup degli utenti sono esclusi dall'ambito del software licenziato.

Configurazione locale, da completare con i propri dati verificati:

```sh
git config user.name "NOME SCELTO"
git config user.email "INDIRIZZO NOREPLY FORNITO DA GITHUB"
git add .
git commit -m "Prima versione web di Risparmio intelligente"
```

## Creazione iniziale del remoto (completata)

La procedura seguente è documentazione di riferimento: origin e il primo push sono già configurati.

Il repository è stato creato inizialmente privato dal proprietario e poi reso pubblico sul suo esplicito mandato. Non ricrearlo: origin e lo storico sono già presenti.

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

## Pubblicazione delle nuove versioni

Prima pubblicazione completata su autorizzazione dell'utente. I successivi push non aggiornano automaticamente il sito: quando una release è autorizzata, avviare manualmente il workflow Pages. La procedura resta:

1. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Actions → **Pubblica su GitHub Pages** → Run workflow, ramo main.
3. Attendere build e deploy verdi. L'URL effettivo compare nel job e nella sezione Pages; tipicamente `https://ACCOUNT.github.io/risparmio-intelligente/`.
4. Verificare su Safari/iPhone: installazione Home, versamento, chiusura/riapertura, backup e ripristino, offline e aggiornamento. Non registrare risparmi importanti prima di questa verifica.
5. Per ogni nuova release: commit/push esegue i controlli; la pubblicazione resta manuale. La cache è versionata dal contenuto della build.

## Dati dopo il deploy

Il registro locale su localhost non si trasferisce automaticamente al dominio GitHub. Esportare il backup dal vecchio indirizzo e importarlo nel nuovo, con conferma. Scegliere un URL stabile: cambiare account/repository/dominio o browser può cambiare il database visibile.

GitHub Pages serve solo file: nessun database cloud e nessuna sincronizzazione tra utenti. Solo codice fidato sullo stesso dominio. Il provider di hosting può registrare metadati di accesso; predisporre le informazioni privacy/supporto prima della diffusione ampia.
