# Account Hub · Giulia

Aggiornamento del sito delle mail esistente, con lo stesso indirizzo e project_id `appgprj_6adf641ad4f48191a212c64d07b91b82`. Accesso riservato alla proprietaria Giulia Balzi. Il precedente progetto Account Hub separato non viene modificato.

## Analisi del trimestre

Outlook è stato riletto dal 26 luglio 2026, ore 00:00 di Roma, fino al 26 ottobre 2026, ore 17:03:57. La paginazione si è conclusa senza ulteriori pagine: 2.014 voci univoche, 292 prive di dati sufficienti, 167 inviate da Giulia, 14 notifiche di mancato recapito, 322 altre comunicazioni, 111 interne da attribuire e 1.108 associate a 10 clienti. Tra le associate, 524 sono dirette e 584 interne.

Le attribuzioni dirette usano il dominio del mittente. Le comunicazioni interne vengono associate a un solo cliente riconosciuto nei destinatari o nell’oggetto; sono esplicitamente da confermare. Le varianti accentate vengono normalizzate. Non si inferiscono clienti dalle firme dei messaggi citati. Le email assegnate sono elencate con metodo di attribuzione e fonte Outlook; quelle interne ambigue hanno una vista separata.

L’analisi iniziale rimane come base storica. A ogni caricamento e al clic Aggiorna il browser legge prima i dati salvati e avvia una sincronizzazione incrementale Outlook autenticata. I dati recenti sono conservati in D1 e aggiunti allo storico, senza rileggere il trimestre. Il confronto con il report precedente da 1.115 messaggi non è diretto: ci sono messaggi nuovi e criteri più conservativi. Le 11 attività preliminari provengono dai materiali salvati del progetto precedente, sono separate dalla raccolta email e non rappresentano un’estrazione completa dei task; due sono bloccate come da non avviare.

## Flusso operativo

Le richieste sono raggruppate per cliente, con conteggi e filtro Email/WhatsApp. WhatsApp è manuale. Le bozze e gli scarti vengono salvati in D1 separatamente per identità autenticata. Ogni invio ClickUp richiede scelta della lista, persona e priorità, una ricerca completa dei duplicati verificata dal server, la spunta di verifica e il clic esplicito Approva. Nessun task viene creato al caricamento. Il registro D1 blocca i doppi invii concorrenti e i reinvii dopo un esito incerto. Non ritentare automaticamente le scritture.

Le integrazioni dichiarate sono Outlook (sola lettura) e ClickUp (lettura e scrittura su approvazione). La raccolta analizzata è già nel progetto; non è richiesta una connessione Library nel sito delle mail. Il link al report storico è solo un collegamento alla fonte originale.

## Costruzione e verifica

`node scripts/build.mjs` crea un unico Worker ESM con la pagina e i dati dell’analisi. `node scripts/verify.mjs` controlla dati, SQL, isolamento per proprietario, gate di approvazione e blocco duplicati con sole fixture locali. `node scripts/preview.mjs` offre una preview con SQLite in memoria e senza connessioni ai provider; non viene distribuita.

Le migrazioni schema-only in drizzle vengono incluse dal confezionamento ufficiale Sites e applicate prima del Worker. Le letture/consensi dei provider sul sito pubblicato sono distinte dalle verifiche locali. I test non creano task reali.


## Aggiornamento incrementale e sintesi

La migrazione 0001 aggiunge hub_mail e hub_sync senza modificare la migrazione applicata precedente. Il controllo parte dal cutoff dell’analisi iniziale (26/10/2026 16:03:57 UTC). Dopo il primo controllo usa il punto dell’ultimo controllo concluso con una sovrapposizione di 5 minuti, per coprire arrivi al confine; gli ID dei messaggi evitano i duplicati. Ogni finestra temporale ha un limite superiore fisso e paginazione da 50 elementi. Il punto definitivo avanza solo quando sono state lette tutte le pagine; in caso di errore le pagine salvate restano e la finestra riprende dal checkpoint. Un lock con scadenza coordina le schede contemporanee. Gli errori non cancellano i dati precedenti né vengono mostrati come assenza di nuove mail. Le voci senza metadati leggibili vengono segnalate separatamente.

Le possibili richieste dei clienti sono riconosciute con criteri testuali conservativi, salvate come bozze da verificare e mai inviate automaticamente a ClickUp. I riassunti sono brevi estratti ripuliti del messaggio, non una valutazione dello stato del lavoro. I testi completi inseriti nelle bozze restano nel dettaglio. Le modifiche e gli scarti dell’utente non vengono sovrascritti dalle letture successive.

Tutte le date visibili nelle richieste, nei dettagli e nell’elenco mail sono in formato italiano con fuso Europe/Rome. Le date storiche già espresse come ora locale vengono mantenute. L’inserimento manuale consente di indicare data e ora originali della richiesta in ora italiana. L’ora legale viene gestita anche per gli input.

WhatsApp verrà collegato in seguito, su indicazione esplicita della proprietaria. Per ora è manuale, con sintesi e data italiana; non viene dichiarata una sincronizzazione WhatsApp attiva.

Verifiche aggiuntive: node scripts/verify-sync.mjs controlla paginazione, ripresa dopo errori, finestre temporali, deduplica, isolamento, lock concorrenti, salvaguardia di modifiche/scarti, date italiane e ora legale. I test del browser verificano un controllo a ogni caricamento, date e sintesi, note integre nel dettaglio e conservazione dei dati con connessione assente. I provider dei test sono fixture; nessun task reale è creato.


## Operativi, risposte e stime storiche

Lo stile riprende il sito ufficiale Netrising verificato il 26/10/2026: Greycliff CF dal kit Adobe pubblico `https://use.typekit.net/wcm3xoq.css`, antracite #202627, bianco e accenti #92CAEA / #A7D3ED. Il logo è quello ufficiale pubblicato sul dominio Netrising. Dal 27/10 il gradiente fucsia-arancione ClickUp distingue le lavorazioni con approvazione cliente documentata; l’azzurro distingue risposte, chiarimenti e approvazioni da verificare. Il colore è sempre accompagnato da testo. Il caricamento effettivo di Greycliff è stato verificato nel browser locale.

Le verifiche leggono lo scambio Outlook pertinente e controllano la più recente indicazione del cliente. I messaggi interni, le citazioni di vecchie approvazioni, le frasi condizionali e i semplici OK di ricezione non costituiscono automaticamente un’approvazione. I risultati mostrano autore, data, fonte e passaggio. La verifica manuale di Giulia richiede fonte HTTPS, passaggio preciso e conferma esplicita; resta distinta dalla verifica automatica. Modifiche alla richiesta o nuovi messaggi noti nello stesso scambio invalidano una precedente classificazione.

Le stime vengono ricavate da ricerche ClickUp paginate fino alla fine e dettagli dei task simili conclusi. Vengono selezionati fino a sei precedenti pertinenti; i tempi dei task padre con sottotask sono esclusi per evitare confronti aggregati. Se ci sono consuntivi, le vecchie stime non vengono mischiate con essi. In assenza di consuntivi si mostrano i preventivi come tali; in assenza di entrambi non si inventa un numero. Le fasce sono l’intervallo osservato per campioni piccoli e l’intervallo interquartile da quattro campioni; si mostrano numerosità, attendibilità, base di calcolo e link ai task. Sono ore di lavoro, non date di consegna. Le richieste composite hanno una stima esplicitamente parziale quando i precedenti coprono solo una componente.

Scambi e stime sono letti progressivamente nel contesto della proprietaria e conservati in D1, con cache limitata e verifica rinnovabile dal dettaglio. Gli errori di connessione non vengono trasformati in stime o approvazioni inventate. La migrazione 0002 aggiunge hub_reviews, hub_review_cache e hub_reply_drafts.

Le risposte sono prime bozze modificabili basate sul contesto della richiesta e su un profilo iniziale ricavato da messaggi professionali inviati da Giulia: tono cordiale, diretto e concreto, richieste chiare, grazie e firma Giulia. Le comunicazioni personali non sono usate come esempi del profilo. Le bozze non dichiarano lavori già eseguiti e non promettono date prive di conferma. Si salvano nel cruscotto o si copiano; non vengono inviate, né creano bozze in Outlook. Le modifiche manuali alla risposta vengono preservate.

La creazione ClickUp continua a richiedere lista, persona, priorità, ricerca duplicati e clic finale esplicito. Ora il server verifica anche la documentazione dell’approvazione cliente e la sua coerenza con la richiesta corrente. Nessuna email o task reale è stato creato durante le verifiche.

Test aggiuntivi: node scripts/verify-reviews.mjs verifica approvazioni e rifiuti, fonti interne/citate/condizionali, consuntivi e preventivi separati, assenza di dati, isolamento per proprietario, cache, bozze non inviate e invalidazione delle approvazioni. Il browser verifica i due colori con etichette, filtri, disabilitazione delle assegnazioni non approvate, font e palette, bozze modificabili e layout mobile. Le fixture dei test non entrano nell’archivio di produzione.


## Navigazione visiva e contesto email (27/10/2026)

I dieci clienti sono identificati dai loghi ufficiali salvati in client-brands.json con i rispettivi riferimenti; per Ser.mac il marchio proviene dal sito del rappresentante ufficiale negli Stati Uniti. I loghi chiari sono su sfondo scuro, senza alterare i marchi. Le schede dei clienti aprono le loro richieste. Il gradiente ClickUp #FF02F0–#FC6D2D distingue i task operativi approvati e quelli assegnati; l’azzurro distingue le risposte e i chiarimenti. Le etichette conservano il significato indipendentemente dai colori.

I quattro riepiloghi sono pulsanti accessibili: risposte/verifiche, portafoglio clienti, operativi approvati e registro ClickUp. Il totale delle email attribuite è nella vista analisi. I volumi storici per cliente sono in un dettaglio espandibile.

All’apertura del dettaglio, request-mail legge soltanto lo scambio relativo alla richiesta e mostra l’ultima email proveniente dal dominio del cliente, con data italiana, mittente e link Outlook, accanto alla bozza. I messaggi interni non sono presentati come risposte del cliente. Il corpo HTML viene convertito in testo e reso con escaping; non carica immagini di tracking né esegue contenuti della mail. Fonte assente, lettura incompleta ed errori di collegamento sono espliciti. Il nuovo endpoint richiede identità, origine valida e archivio proprietario; non invia email e non crea task.


## Riepiloghi e stato dei clienti

La sezione Clienti contiene per ciascuno dei dieci clienti: riepilogo dei temi più recenti, cronologia di sei conversazioni con estratti e link Outlook, ultima comunicazione dal cliente e da Netrising, conteggi delle richieste nel cruscotto, valutazione motivata e prossimo passo suggerito. I conteggi dei task indicano soltanto richieste e assegnazioni registrate da questo cruscotto, non la totalità del lavoro ClickUp.

La lettura viene ricostruita sul server a ogni caricamento dai metadati dello storico e dalle mail incrementali della proprietaria. Non aggiunge nuove scansioni della casella e non richiede migrazioni. Distingue messaggi dal dominio del cliente, comunicazioni Netrising con il cliente tra i destinatari e contesto interno attribuito dall’oggetto. Le valutazioni usano gli estratti scritti dal cliente, senza testo citato, inviti di calendario o ripetizioni dello stesso ID.

La finestra dei segnali è di 30 giorni: apprezzamento esplicito o risoluzione confermata, richiesta di aggiornamento o urgenza, contestazione esplicita. Le conferme ordinarie e i ringraziamenti non provano soddisfazione. Una risposta Netrising successiva non viene confusa con la risoluzione; una risoluzione esplicita del cliente chiude i precedenti segnali nello stesso oggetto. Vecchie contestazioni e frasi condizionali non diventano criticità attuali. L’assenza di segnali lascia l’esito da confermare; pochi dati o nessun contatto recente vengono segnalati come insufficienti. Ogni motivazione mostra un estratto verificabile con data e fonte.

È una classificazione testuale indicativa, non una misura di qualità, rispetto delle consegne o soddisfazione complessiva. L’attendibilità indica la disponibilità di riscontri recenti (media da cinque messaggi diretti, altrimenti bassa o insufficiente), non una probabilità. WhatsApp e allegati non sono inclusi. Le fonti parziali e questi limiti sono visibili nel sito.

node scripts/verify-clients.mjs controlla provenienza, citazioni, frasi condizionali, date, risoluzioni, criticità successive, duplicati, ringraziamenti, isolamento tra proprietari e accesso autenticato. La verifica browser copre selezione del cliente, riepilogo, fonte della valutazione, apertura delle richieste e layout mobile. Nessuna email o task viene creato.


## Risorse e ore settimanali

La sezione Risorse usa soltanto azioni di lettura ClickUp. L’elenco iniziale contiene gli assegnatari attuali dei task creati dall’account ClickUp connesso e le assegnazioni approvate tramite il cruscotto; non è uno storico di chi ha modificato gli assegnatari. Le fonti sono apribili. Le persone possono essere aggiunte o escluse e marcate come condivise con altri PM. Non si assume un rapporto gerarchico o un’assegnazione esclusiva. Il rilevamento segue le pagine di ricerca fino alla fine e si riprende dal cursore salvato; le letture parziali o i cicli di paginazione sono segnalati. I cursori scaduti ripartono dopo un’ora.

Le settimane sono lavorative lunedì–domenica in Europe/Rome, esplicitamente indipendenti dall’inizio settimana domenicale configurato nell’account ClickUp. Ogni lettura verifica identità, orologio e fuso del connettore. I consuntivi comprendono tutti i task dell’operatore (anche di altri PM), senza filtro per progetto o fatturabilità. La soglia 7:15 equivale esattamente a 435 minuti; le durate si confrontano prima di arrotondare la visualizzazione. Si escludono timer aperti, voci senza autore verificabile e registrazioni non valide; si deduplicano gli ID e si segnalano sovrapposizioni. Gli intervalli a cavallo della mezzanotte vengono ripartiti nei giorni italiani e limitati ai confini della settimana; l’ora legale è gestita.

La fonte HR scoperta è la lista Ferie e Permessi (901510710693), nello spazio HR & Operations (90154421200), con stati richiesta, approvata, rifiutata e annullata. Sono lette soltanto le assenze della persona selezionata, seguendo tutte le pagine. Per il periodo si verificano i dettagli start_date, due_date, stato e time_estimate. Una durata approvata di almeno 8 ore per giorno lavorativo è considerata assenza intera; il valore di riferimento è conservativo, distinto dal minimo di registrazione di 7:15. Durate inferiori, mancanti e permessi parziali non sono automaticamente dedotti dal minimo e restano da verificare. La stima viene ripartita sui giorni lun–ven dell’intervallo inclusivo. Non si espongono motivazioni sanitarie.

Non è stato trovato un registro di timbrature. Zero ore senza presenza verificabile resta da confermare; non è etichettato come assenza o omissione certa. Attività registrata in un giorno feriale permette di desumere presenza e applicare il minimo standard, con fonte indicata nel dettaglio. Sabato/domenica sono fuori calendario, modificabili per eccezioni. Oggi e i giorni futuri non risultano sotto soglia. Una rettifica locale permette di confermare presenza, assenza, giornata non lavorativa o soglia di una giornata parziale; non modifica ClickUp. Le ferie approvate con ore registrate, i permessi incerti e le sovrapposizioni richiedono verifica. Il totale settimanale non è una certificazione di presenze o qualità del lavoro.

La migrazione 0003 aggiunge profili, fonti di scoperta, checkpoint di lettura e rettifiche giornaliere, tutti isolati per proprietario e identità ClickUp. I consuntivi hanno cache di dieci minuti e la scoperta riparte automaticamente dopo dieci minuti. Le letture fallite non sono presentate come zero ore. I test verify-resources.mjs coprono soglia esatta, DST, mezzanotte, duplicati, timer, sovrapposizioni, ferie e permessi, presenza sconosciuta, date correnti/future, paginazione, profili condivisi, cache e isolamento. I test browser usano esclusivamente fixture per le ore e verificano navigazione, dettagli, rettifiche, condivisione e mobile; non scrivono sui provider.


## WhatsApp Web nel browser interno

Il 27/10 la proprietaria ha confermato di usare la sessione WhatsApp aziendale con conversazioni rivolte a Sofia. La lettura avviene dall’interfaccia WhatsApp Web autorizzata nel browser interno: non si estraggono cookie, token o stato interno dell’app e non si usano API private. I messaggi sono trasferiti al cruscotto attraverso l’importazione autenticata di una lettura preparata dal browser. Non è una sincronizzazione autonoma all’apertura del sito e non è eseguita in background quando l’assistente non lavora. La modalità è dichiarata nella UI. Per una nuova lettura l’utente può chiedere in chat “Aggiorna WhatsApp nel cruscotto”.

La lettura iniziale riguarda il testo caricato e visibile di otto conversazioni aziendali, con un limite recente di 14 giorni, senza gruppi personali, codici di accesso, audio, immagini o allegati. Non si dichiara completezza dello storico. Ogni conversazione ha una mappatura esplicita al cliente e ogni messaggio ha l’ID dell’elemento reso dalla UI, autore, direzione e data originale convertita da Europe/Rome. L’autore della sessione aziendale è distinto da Giulia. I dati letti non vengono inclusi nei sorgenti del sito: sono importati nel D1 privato dopo la pubblicazione.

La migrazione 0004 aggiunge conversazioni, messaggi e ricevute per proprietario. Una chiave della fonte e gli ID di chat/messaggio deduplicano le letture ripetute; i messaggi modificati aggiornano la revisione della conversazione. Le richieste sono proposte con riferimenti al messaggio in entrata e non sono approvazioni né task ClickUp. Riletture non sovrascrivono titoli/note modificati, scarti o invii. Cambiamenti del contesto invalidano l’approvazione precedente. I riferimenti alla fonte vengono preservati salvando una bozza. Per Aran la UI mostrava messaggi effimeri a 90 giorni: gli originali importati hanno la stessa scadenza calcolata dalla data del messaggio, senza rinnovo alla rilettura. La sintesi di una richiesta rimane un appunto di lavoro distinto dall’originale.

Il dettaglio delle richieste WhatsApp mostra il testo importato e la chat, con autore e data italiana. Il link apre WhatsApp Web; non viene presentato come collegamento diretto a un messaggio. L’operatore ritrova il passaggio tramite chat, data e autore. La vista WhatsApp mostra ultima importazione e conversazioni disponibili. La qualità del rapporto cliente continua a essere valutata sui soli estratti email, come dichiarato nella sua vista.

verify-whatsapp.mjs controlla identità, origine, isolamento, deduplicazione, nuove versioni, scadenze, richieste senza approvazione, invalidazione delle approvazioni e conservazione di modifiche e scarti. Nessun messaggio WhatsApp viene inviato e nessun task ClickUp viene creato dalla lettura o dall’importazione.


## Aggiornamento e argomenti condivisi
La pagina avvia un controllo incrementale Outlook al caricamento e ogni dieci minuti dopo il completamento del ciclo precedente, senza sovrapposizioni. Il pulsante Aggiorna rimane disponibile; al ritorno alla scheda o della connessione riprende un controllo scaduto. I browser possono sospendere le schede inattive. Le modifiche non salvate nei dettagli e nelle bozze restano aperte.
Email e WhatsApp sono nella stessa coda cronologica, distinti dai badge azzurro e verde. I colori delle azioni operative e delle risposte restano indipendenti dal canale.
I collegamenti per argomento sono metadati privati del proprietario in hub_topics (migrazione 0005). La pagina suggerisce affinità lessicali prudenti tra richieste recenti dello stesso cliente; il dettaglio permette collegamenti espliciti e reversibili. Collegare fonti non modifica approvazioni, stime o task e non chiama provider esterni.
WhatsApp non è letto dal server del sito. L’automazione locale Codex Aggiorna WhatsApp · Account Hub Giulia (ID aggiorna-whatsapp-account-hub-giulia) controlla ogni dieci minuti le otto conversazioni autorizzate tramite il browser interno. Richiede computer/app attivi e sessione collegata. Usa l’ultimo messaggio conservato per chat come checkpoint e gli ID nativi per deduplicare; non usa il timestamp dell’importazione come limite. Dopo una lettura completa senza novità può premere Registra controllo completato senza novità. Questo registra un controllo distinto dall’importazione e non va premuto se il browser non ha effettivamente verificato le chat. Le letture parziali devono essere dichiarate. Nessun task o messaggio viene creato automaticamente.


## Cliente VIP Riccione e Shuttle
VIP Riccione e Shuttle Italy Airport appartengono allo stesso cliente. Il nome unico è VIP Riccione / Shuttle Italy Airport. Lo storico originale resta nei JSON sorgenti; build e letture normalizzano le due attribuzioni e aggregano conteggi, riepiloghi e filtri senza cambiare gli ID di email e richieste. I payload precedenti sono normalizzati in lettura. I nuovi messaggi diretti o con entrambi i marchi tra i destinatari confluiscono nello stesso cliente. Lo storico per le stime cerca entrambi i marchi. La home raggruppa per cliente, ordinando i blocchi per richiesta più recente e mantenendo gli argomenti condivisi all’interno del cliente.

Il controllo della pagina include le letture ClickUp per scambi/stime scaduti e, se visibile, la sezione Risorse; cache e aggiornamenti automatici hanno intervallo di dieci minuti. Il controllo forzato può rileggerli prima della scadenza. Gli argomenti collegati hanno una testata comune Email/WhatsApp e una linea con nodi distinti per canale, all’interno del gruppo cliente. Nessuna nuova associazione viene dedotta dalla sola vicinanza grafica.


## Risorse: finestra iniziale di due mesi
La sezione Risorse usa una finestra mobile di due mesi di calendario in Europe/Rome (27 agosto–27 ottobre alla modifica). La ricerca ClickUp applica creatore uguale all’utente autenticato e data di creazione compresa nella finestra, con limite superiore fissato per tutte le pagine della scansione. Gli assegnatari e i nomi provengono dai task trovati: la sezione non chiama più clickup_get_workspace_members. Non sono inclusi profili manuali o vecchi collegamenti privi di una prova nella scansione corrente. Le preferenze locali (inclusa/condivisa) sono conservate quando una persona torna idonea. La migrazione 0006 invalida la vecchia scansione non delimitata senza cancellare i profili.
Le settimane esterne al periodo sono bloccate anche lato server; le settimane di confine leggono solo le date consentite e mostrano Fuori periodo sulle altre giornate. Le ore della persona continuano a comprendere tutti i suoi task per verificare il minimo giornaliero. L’elenco certifica il creatore del task e gli assegnatari restituiti adesso, non lo storico completo di chi assegnò il lavoro. La directory completa resta necessaria solo nel flusso separato di nuova assegnazione ClickUp, non nella sezione Risorse.

Le assenze approvate che attraversano i confini del periodo vengono lette come contesto per i giorni inclusi: la data di fine può essere successiva a oggi. Le assenze interamente future sono scartate prima della conservazione. I dati e le soglie mostrati rimangono limitati alla finestra di due mesi.

In caso di errore nella lettura delle ore, la coda si ferma dopo le richieste già in corso (massimo due), conserva i dati precedenti e non tratta le ore non lette come zero. Le rimanenti persone sono segnate come lettura sospesa. Lo storico dei task conclusi usato dalle stime è riutilizzato fino a 24 ore per limitare le chiamate ClickUp; la verifica forzata dal dettaglio resta disponibile. I consuntivi recenti mantengono il controllo a dieci minuti. Il 27 ottobre il connettore nativo ha diagnosticato RATE_LIMIT_EXCEEDED: 2.500/2.500 chiamate MCP, non un errore della connessione aziendale.
