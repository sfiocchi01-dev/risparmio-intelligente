# Specifica funzionale web

## Scopo e piattaforma

Registro virtuale personale dei risparmi in euro, senza accesso bancario. PWA statica installabile sulla Home, funzionamento offline dopo il primo caricamento e completamento della cache, dati locali e backup esportabile. Nessun account o sincronizzazione cloud.

## Salvadanai

Stessa forma trasparente cartoon, nome personalizzabile, obiettivo positivo, saldo iniziale facoltativo entro l'obiettivo, avanzamento visivo e percentuale testuale. Nessuna scadenza obiettivo. Una sola categoria prioritaria, persistente fino alla disattivazione o eliminazione.

## Ripartizione

1. Eventuale priorità riceve tutto fino al completamento.
2. Il resto riempie prima le categorie con percentuali inferiori.
3. Raggiunta la stessa percentuale, crescono insieme in proporzione agli obiettivi.
4. Le categorie complete non ricevono oltre l'obiettivo.
5. Il denaro non assorbibile va nel saldo da assegnare.

I saldi già assegnati non vengono spostati automaticamente. La priorità completa rimane attiva e torna a ricevere per prima dopo un prelievo.

Esempio: obiettivi Auto 2.000 € e Vacanze 1.000 €, inizialmente vuoti; un versamento di 300 € assegna 200 € e 100 €, entrambi al 10%. Se Auto è al 50% e Vacanze al 10%, i nuovi fondi fanno prima recuperare Vacanze.

## Operazioni e totale

- Versamento esterno: ripartisce e aumenta il totale.
- Saldo iniziale: aumenta il totale, registra un movimento e non redistribuisce.
- Prelievo categoria: positivo, entro il saldo, diminuisce il totale.
- Trasferimento: positivo, entro disponibilità sorgente e capacità destinazione, totale invariato.
- Saldo libero: distribuzione solo su comando esplicito; pulsante di prelievo diretto subito sotto. Il prelievo libero riduce totale e saldo libero, senza modificare categorie.
- Modifica obiettivo: se inferiore al saldo, eccedenza nel saldo libero; totale invariato.
- Eliminazione: conferma con redistribuzione oppure prelievo totale; possibilità di annullare. La redistribuzione ignora la priorità e usa il normale allineamento percentuale, con eccedenze da assegnare anche eliminando l'ultima categoria. Non distribuisce fondi liberi preesistenti. Il prelievo totale riduce il totale del saldo eliminato. Se eliminata, la priorità viene rimossa.
- Movimenti: conservano data/ora originale e nomi leggibili anche dopo eliminazioni; sezione distinta dai salvadanai con linea divisoria.

Totale = saldi categorie + saldo libero. Nessun saldo negativo o obiettivo superato. Calcoli in centesimi interi; prodotti esatti BigInt, resti maggiori e ID stabili per le parità. Limiti tecnici iniziali: 1.000 categorie, 10 miliardi di euro per importo/obiettivo/totale, 100.000 movimenti.

## Salvataggio e backup

Ogni operazione valida viene salvata con saldi e movimento nella stessa transazione IndexedDB. Errori di scrittura e revisioni obsolete non applicano modifiche. Le altre schede vengono informate, ma non si sincronizzano dispositivi distinti.

Backup JSON in chiaro con versione schema, categorie, saldo libero, priorità e storico. Ripristino con validazione, riepilogo e conferma: sostituisce, non unisce, il registro. Nessuna cancellazione silenziosa in caso di errore. Il database del browser può essere eliminato dall'utente o dal sistema; esportare periodicamente una copia.

## Promemoria

Esportazione facoltativa di un evento Calendario mensile, nel giorno scelto o ultimo giorno per mesi più corti. Importazione e notifiche dipendono dal calendario e dai permessi del dispositivo. Nessuna notifica push della PWA e nessun movimento registrato senza conferma.

## Distribuzione e privacy

Hosting statico HTTPS, nessun dato finanziario nel repository o nell'hosting. Il provider può registrare normali metadati di accesso ai file. Nessun analytics o collegamento a servizi bancari. Prima della distribuzione definitiva verificare Safari/iPhone, offline, backup, aggiornamenti e accessibilità.
