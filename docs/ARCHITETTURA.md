# Architettura web — versione 0.1

## Scelte

HTML/CSS e JavaScript a moduli, senza framework, pacchetti runtime, CDN o font remoti. Deploy statico adatto a GitHub Pages; Node serve solo per anteprima, build e test. Nessun servizio esterno o account creato.

## Separazione

1. **Dominio puro**: importi in centesimi interi sicuri, massimo 1.000.000.000.000 centesimi per importo/obiettivo/totale e 1.000 categorie. Ripartizione water filling esatta con prodotti/divisioni BigInt e centesimi residui ai resti maggiori. Parità risolta per ID stabile (UUID nelle categorie create dall'app).
2. **Persistenza**: un documento versionato contiene categorie, saldo libero, priorità e movimenti. Ogni modifica usa una sola transazione readwrite IndexedDB; saldo e storico vengono salvati insieme, oppure nessuno dei due.
3. **UI**: mostra soltanto lo stato già salvato; errori e saldi insufficienti non applicano operazioni. I valori utente/importati sono trattati come testo con escaping prima dell'inserimento in HTML.
4. **PWA**: cache degli asset dell'app, separata dal database dei risparmi. La build usa una versione cache derivata dal contenuto. Le nuove release attendono l'attivazione; un banner persistente offre «Aggiorna ora» e «Più tardi». Il rinvio vale per la sessione e non nasconde l'opzione nelle impostazioni. Pulsanti disabilitati durante scritture; durante l'attivazione non si avviano nuove operazioni. Nessun aggiornamento forza il reload di un'altra scheda con un modulo aperto. Il browser può attivare autonomamente il worker in attesa quando tutte le finestre precedenti si chiudono. La rilevazione viene rieseguita anche al ritorno all'app, con throttling e tolleranza alla rete assente.

## Concorrenza locale

Ogni commit porta una revisione attesa. La transazione legge la revisione corrente e rifiuta una scrittura obsoleta. BroadcastChannel segnala cambiamenti alle altre schede; i dati non sono comunque sovrascritti se una scheda perde una notifica. In caso di conflitto chiudere il modulo e ricaricare. Nessun merge o sincronizzazione tra telefoni è promesso.

Questa scelta è diversa dal ledger multi-device discusso per iCloud: qui c'è un solo archivio browser e nessun cloud. I movimenti sono una cronologia locale con timestamp, non un ledger distribuito o prova bancaria.

## Backup

Contenitore `app=risparmio-intelligente`, schema 1 e stato validato. Controlli su importi, totale, obiettivi, priorità, ID duplicati, date, tipi e limiti dimensionali (20 MB file; 100.000 movimenti). Il ripristino seleziona solo campi noti, richiede conferma e sostituisce atomicamente il documento locale con nuova revisione.

Nessuna cifratura, autenticità certificata o recupero automatico da file alterati. La validazione controlla struttura/invarianti, non dimostra che i saldi derivino dalla cronologia. Il backup è personale e non va mai pubblicato.

## Piattaforma web e privacy

IndexedDB e BroadcastChannel sono separati per origine/percorso applicativo; non sono iCloud. L'origine web rimane il confine di sicurezza del browser: altri script dello stesso dominio devono essere fidati. HTTPS obbligatorio fuori da localhost per il service worker.

Il browser può negare la persistenza o eliminare dati locali; backup e consenso esplicito prima della sostituzione rimangono essenziali. Non usare navigazione privata per risparmi reali. Nessun dato viene mandato al sito, ma l'hosting può registrare normali richieste di file/IP: non presentare il servizio come privo di qualsiasi metadato di rete.

## Promemoria

Esportazione di un evento calendario alle 09:00 locali. Ricorrenza mensile con il giorno scelto o ultimo giorno del mese se più corto (`BYMONTHDAY=giorno,-1;BYSETPOS=1`). Il calendario gestisce avvisi e permessi. Non sono notifiche locali programmate dalla PWA; l'importazione effettiva su Calendario iOS resta da collaudare.

## Fuori ambito

Sincronizzazione remota, credenziali, raccolta dati, pagamenti, notifiche push, pubblicazione automatica. Qualunque aggiunta richiede una nuova scelta architetturale e test.
