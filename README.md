# Account Hub · Giulia — sorgenti trasferibili

Progetto Sites: `appgprj_6adf641ad4f48191a212c64d07b91b82`  
Sito privato: https://richieste-mail-balzi-261026.netrising-1170.chatgpt.site/  
Commit di origine recuperato dal repository: `85d87c77309a61cd0d079d1f263dbfe3f23aa003`

Questa esportazione non ha modificato il repository né pubblicato il sito. I sorgenti applicativi sono quelli del commit indicato. Sono aggiunti soltanto questo README, il lockfile del progetto senza dipendenze, `.env.example`, lo script locale `scripts/check-all.mjs` e i metadati di provenienza. Il README originale è conservato integralmente in `docs/README-progetto-originale.md`; contiene anche note storiche superate, quindi per l’avvio usare queste istruzioni.

## Requisiti e installazione

Estrarre lo ZIP e aprire il terminale nella cartella `Account-Hub-Giulia`.

- **Node.js 24 o successivo**: verifiche e anteprima usano `node:sqlite`.
- Il Worker effettivo non ha dipendenze npm esterne: non serve installare pacchetti per build, verifiche e anteprima. Sono inclusi `package.json` e un lockfile npm v3 coerente con il grafo vuoto. Se npm è disponibile, `npm ci --ignore-scripts --no-audit --no-fund` è facoltativo.
- Git e il plugin **Sites** in Codex sul nuovo computer servono per recuperare il repository associato e pubblicare. Non sono necessari per la verifica locale della copia.
- Nessuna chiave segreta va inserita nei sorgenti. `.env.example` documenta che non sono richieste variabili segrete locali. Credenziali e sessioni non si trasferiscono con lo ZIP.

## Costruzione

```sh
node scripts/build.mjs
```

Genera `dist/server/index.js` e `dist/.openai/hosting.json` dai sorgenti in `worker/`. L’ID del sito è verificato durante il build. `dist/` non va modificata a mano e non è inclusa nello ZIP: si rigenera con questo comando.

## Verifiche complete

Dopo la costruzione:

```sh
node scripts/check-all.mjs
```

Esegue tutti gli script `scripts/verify*.mjs`: migrazioni SQLite, dati storici, isolamento per proprietario, gate di approvazione, duplicati, sincronizzazione, argomenti, clienti unificati, controllo ore e finestra risorse di due mesi. I provider dei test sono fixture locali: nessun task reale viene creato e nessun messaggio viene inviato.

Per la sola verifica di base: `node scripts/verify.mjs` oppure `npm test`.

## Avvio locale

Dopo il build:

```sh
node scripts/preview.mjs
```

Aprire http://127.0.0.1:8767/ e terminare con Ctrl+C. L’anteprima usa SQLite in memoria e un’identità di prova, senza connessioni ai provider. I dati di prova scompaiono al riavvio e gli avvisi di connessione alle app sono previsti. Non esporre questo server come ambiente di produzione. Dopo una modifica ricostruire e riavviare l’anteprima.

## Mappa del progetto

| Percorso | Contenuto |
| --- | --- |
| `worker/index.js` | Worker HTTP, autenticazione, API e scritture protette |
| `worker/client.js` | Richieste, filtri, dettaglio, argomenti e approvazioni |
| `worker/page.html`, `worker/brand.css` | Interfaccia e stile Netrising |
| `worker/feed.js` | Timer di 10 minuti, affinità e coda di lettura protetta |
| `worker/shared.js`, `worker/workflow.js` | Date italiane, sintesi, attribuzioni e regole operative |
| `worker/sync.js`, `worker/reviews.js`, `worker/whatsapp.js` | Sincronizzazione, fonti, stime, bozze e importazioni |
| `worker/clients.js` | Riepiloghi e valutazioni dei clienti |
| `worker/resources.js`, `worker/resource-client.js`, `worker/resource-math.js` | Risorse ClickUp e monitoraggio delle ore |
| `worker/analysis.json`, `worker/baseline.json`, `worker/unassigned.json` | Dati storici già inclusi nel repository |
| `worker/client-brands.json` | Loghi clienti incorporati come data URI |
| `drizzle/`, `drizzle/meta/_journal.json` | Schema e migrazioni dalla 0000 alla 0006 |
| `.openai/hosting.json` | ID Sites, binding DB e integrazioni |

L’implementazione è un Worker ESM senza framework. I loghi clienti incorporati sono inclusi. Il logo Netrising e il font Adobe pubblici rimangono riferimenti esterni presenti nei sorgenti: richiedono rete, non credenziali.

## Dati che rimangono online

Lo ZIP contiene i file dati presenti nel repository, **non un dump del database D1 di produzione**. Email incrementali, messaggi WhatsApp importati, bozze, scarti, argomenti collegati, preferenze delle risorse e registro degli invii aggiornati restano nel database del progetto. Riutilizzare lo stesso `project_id` e il binding `DB`: non azzerare il database e non rieseguire manualmente le migrazioni già applicate.

WhatsApp usa la sessione aziendale autorizzata nel browser interno e l’automazione locale Codex `aggiorna-whatsapp-account-hub-giulia`, ogni 10 minuti. Automazione e sessione browser **non sono comprese nello ZIP e non vengono trasferite automaticamente**. Prima di attivare il controllo sull’altro computer verificare dove gira quello esistente, per non duplicarlo. Non trasferire cookie o token.

Outlook e ClickUp sono forniti dalla piattaforma all’utente autenticato, con i relativi consensi. L’anteprima locale non replica questi accessi. Il monitoraggio ore può essere temporaneamente limitato dalla quota del connettore ClickUp.

## Pubblicazione futura sullo stesso sito

Queste sono istruzioni per il lavoro futuro: la preparazione dello ZIP non ha pubblicato nulla.

1. Installare/abilitare Sites nel nuovo Codex e accedere con l’account proprietario. Leggere la skill Sites installata sul nuovo computer, il cui percorso dipende dall’installazione.
2. Aprire il progetto **esistente** `appgprj_6adf641ad4f48191a212c64d07b91b82`. Verificare con `get_site` proprietà e accesso riservato alla sola Giulia. Non usare `create_site` e non cambiare il `project_id`.
3. Ottenere nuove credenziali temporanee con `create_source_repository_write_credential`. Eseguire il source helper ufficiale in una cartella dedicata: `node <percorso-plugin-Sites>/scripts/site-workflow.mjs --project-id appgprj_6adf641ad4f48191a212c64d07b91b82`. Passare le credenziali tramite stdin nascosto, mai in file, argomenti o output.
4. Usare il checkout restituito dal helper. Lo ZIP non contiene `.git`. Confrontare il commit remoto aggiornato con `85d87c77309a61cd0d079d1f263dbfe3f23aa003` e riconciliare eventuali aggiornamenti prima di applicare i sorgenti modificati della copia ZIP. Conservare la metadata Git del checkout aperto dal helper.
5. Conservare `.openai/hosting.json`, ID e binding DB. Verificare tramite Sites l’idoneità delle integrazioni dichiarate. Per cambiamenti allo schema aggiungere nuove migrazioni, senza riscrivere quelle applicate.
6. Eseguire build e verifiche complete. Confezionare con il source helper usando l’oggetto di apertura come `source` e un `archivePath` assoluto per il tar di distribuzione. Se build e verifiche sono già completate con sorgenti invariati, passare `commands: []`; altrimenti passare i comandi rimanenti come array ordinati. Il helper sincronizza il commit esatto e include le migrazioni nella distribuzione. **Questo ZIP di sorgenti non è il tar da fornire al deploy.**
7. Solo quando si vuole effettivamente pubblicare, usare `save_version_and_deploy_private` con `project_id`, `commit_sha` e `archive` esatti restituiti dal confezionamento. Attendere lo stato terminale `succeeded`. Se proprietà o permessi sono cambiati, risolvere la situazione senza rendere pubblico il sito.

## Prossimo lavoro: Fatto, archivio e Ripristina

Queste funzioni non sono state aggiunte durante l’esportazione. I punti da modificare sono `worker/client.js`, le API in `worker/index.js` e una nuova migrazione D1. Conservare gli ID delle richieste e separare l’archiviazione interna dallo stato del task ClickUp. Preservare scarti, approvazioni e registro degli invii. Ripristinare una richiesta non deve duplicare task né approvarne automaticamente la creazione.

## Dove personalizzare il cruscotto per un'altra persona

I dati e i riferimenti di Giulia sono lasciati volutamente nel repository come esempio. Per adattare il cruscotto a un'altra persona, questi sono i punti da cambiare.

### Dati storici (generati una volta leggendo Outlook)

| File | Cosa contiene | Cosa fare |
| --- | --- | --- |
| `worker/analysis.json` | Storico email del trimestre: `period` (con `cutoffUTC`, da cui riparte la sincronizzazione incrementale), conteggi per gruppo, clienti e `messages` | Rigenerare chiedendo a ChatGPT di rileggere l'Outlook della nuova persona nello stesso formato |
| `worker/baseline.json` | Elenco `clients` (solo questi clienti sono accettati dal sito), richieste iniziali `requests` e `provenance` | Sostituire con i clienti e le richieste della nuova persona |
| `worker/unassigned.json` | Email interne non ancora attribuite a un cliente | Rigenerare insieme ad `analysis.json` (può anche essere `[]`) |
| `worker/client-brands.json` | Loghi dei clienti incorporati come data URI | Una voce per cliente, con lo stesso nome usato in `baseline.json` |

Dopo il primo avvio il sito aggiunge da solo le email nuove da Outlook a partire da `cutoffUTC`: lo storico precedente arriva solo da questi file.

### Riferimenti nel codice

| File | Riferimento |
| --- | --- |
| `worker/shared.js` (riga ~38) | Email del proprietario `g.balzi@netrising.com`, usata per riconoscere le email inviate |
| `worker/shared.js` (riga ~40) | Tabella `domains`: associa ogni cliente ai suoi domini email |
| `worker/shared.js` (riga ~43) | Domini interni considerati (`netrising.com`, `custom.it`) |
| `worker/workflow.js` | `VOICE_PROFILE` e firma delle bozze di risposta ("Giulia") |
| `worker/page.html` | Titolo, nome, iniziali e ruolo mostrati nell'interfaccia |
| `worker/client.js`, `worker/index.js` | Testi "verifica manuale di Giulia" |
| `worker/resources.js` | `RESOURCE_HR_LIST`: ID della lista ClickUp Ferie e Permessi |
| `scripts/build.mjs` e `.openai/hosting.json` | `project_id` del progetto Sites (`appgprj_6adf…`): ogni persona deve usare il proprio progetto Sites |

Il cruscotto di Giulia è collegato al suo account Sites: chi lo riutilizza deve creare un proprio progetto Sites e non pubblicare su quello esistente.

## Provenienza

`SOURCE.json` documenta origine e aggiunte al pacchetto. `SOURCE-FILES-SHA256.json` elenca le impronte dei file originali; per il README originale usare la copia in `docs/README-progetto-originale.md`. Nessun file applicativo è stato cambiato per l’esportazione. Sono esclusi `.git`, output compilati, `node_modules`, cache, credenziali e token.

Verifica della copia esportata: costruzione e tutti gli script verify completati con esito positivo; controllo dei pattern di chiavi private, token di servizio e credenziali incorporate senza riscontri. Nessun test ha usato scritture reali sui provider.
