import {cleanMessage,summarize} from './shared.js';
import {normalizedSubject} from './workflow.js';
const DAY=86400000;
export function clientMailDirection(mail){
 if(mail.method==='Dominio mittente')return 'client';
 if(mail.direction==='outgoing'||mail.method==='Destinatari del cliente'&&/@netrising\.com$/i.test(mail.from||''))return 'agency';
 return 'internal';
}
export function clientMailSignals(value){
 const text=cleanMessage(value);const statements=(text.match(/[^.!?]+[.!?]?/g)||[]).filter(s=>!s.trim().endsWith('?')&&!/\b(?:se|qualora)\b|nel caso|ipotizz/i.test(s)).join(' ');const signals=[];
 if(/\bnon\s+(?:siamo|sono)\s+(?:per niente\s+|molto\s+)?soddisfatt|\b(?:siamo|sono)\s+(?:molto\s+)?insoddisfatt[oi]\b|\b(?:siamo|sono)\s+delus[oi]\b|non avete rispettato.{0,50}(?:scadenz|accord)|(?:interrompere|disdire|recedere).{0,35}(?:contratto|collaborazione|rapporto)/i.test(statements))signals.push('critical');
 if(/\bsollecit(?:o|iamo|are)\b|non (?:abbiamo|ho) ancora ricevuto|(?:avete|ci sono) novit[aà]|in attesa di (?:un vostro|una vostra|vostro) (?:riscontro|risposta|aggiornamento)/i.test(text))signals.push('followup');
 if(/\burgentemente\b|(?:abbiamo|ho|avrei) bisogno.{0,25}\burgent|(?:procedi|procedete|fatelo|falle fare)\s+(?:subito|immediatamente)|siamo fermi con (?:la )?comunicazione/i.test(text))signals.push('urgent');
 if(/\b(?:ottimo|bel|eccellente)\s+lavoro\b|\b(?:siamo|sono)\s+(?:molto\s+)?soddisfatt[oi]\b|\b(?:risultato|lavoro)\s+(?:è\s+)?(?:ottimo|perfetto|eccellente)\b/i.test(statements)&&!signals.includes('critical'))signals.push('positive');
 if(!/\bnon\s+(?:(?:è|e)\s+)?(?:(?:ancora|stato)\s+){0,2}(?:risolt|sistemat)/i.test(statements)&&/\b(?:problema|errore|criticità).{0,35}(?:risolt[oa]|sistemat[oa])|ora (?:va|funziona) (?:tutto )?bene|tutto (?:risolto|sistemato)/i.test(statements))signals.push('resolved');
 if(/\b(?:approv(?:o|iamo|at[oa])|conferm(?:o|iamo)|(?:per me )?vanno bene|(?:per me )?va bene)\b/i.test(statements)&&!/non\s+(?:approv|conferm|va|vanno)|[?]|da approvare|da confermare|conferm\w*.{0,25}(?:ricezion|ricevut|call|appuntamento)/i.test(statements))signals.push('confirmation');
 return signals;
}
function evidence(mail,type,thread){const text=cleanMessage(mail.preview);const passage=(text.match(/[^.!?]+[.!?]?/g)||[]).find(s=>clientMailSignals(s).includes(type))||text;return {type,subject:normalizedSubject(mail.subject),text:passage.length>420?passage.slice(0,417)+'…':passage.trim(),date:mail.date,from:mail.from,url:mail.url,id:mail.id,agencyReplyAfter:!!thread.agency.find(m=>Date.parse(m.date)>Date.parse(mail.date))};}
export function buildClientInsights(clients,messages,now=new Date().toISOString()){
 const clock=Date.parse(now),recentFrom=clock-30*DAY;
 return clients.map(client=>{
  const unique=[...new Map(messages.filter(m=>m.client===client.name&&m.id&&m.subject&&Number.isFinite(Date.parse(m.date))&&Date.parse(m.date)<=clock&&!m.calendar).map(m=>[m.id,m])).values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  const direct=unique.filter(m=>clientMailDirection(m)==='client'),agency=unique.filter(m=>clientMailDirection(m)==='agency'),internal=unique.filter(m=>clientMailDirection(m)==='internal');
  const grouped=new Map();for(const m of unique){const key=normalizedSubject(m.subject).toLocaleLowerCase('it');if(!grouped.has(key))grouped.set(key,{subject:normalizedSubject(m.subject),messages:[],direct:[],agency:[]});const t=grouped.get(key);t.messages.push(m);if(clientMailDirection(m)==='client')t.direct.push(m);if(clientMailDirection(m)==='agency')t.agency.push(m);}
  const topics=[],signals=[];
  for(const t of grouped.values()){
   if(!t.direct.length&&!t.agency.length)continue;
   const latest=t.direct[0]||t.agency[0],latestExchange=t.messages[0];
   const events=t.direct.map(m=>({mail:m,types:clientMailSignals(m.preview)}));
   const resolution=events.filter(e=>e.types.includes('resolved')).reduce((n,e)=>Math.max(n,Date.parse(e.mail.date)),0);
   for(const type of ['critical','followup','urgent','positive','resolved','confirmation']){
    const found=events.find(e=>e.types.includes(type)&&Date.parse(e.mail.date)>=recentFrom&&(!['critical','followup','urgent'].includes(type)||Date.parse(e.mail.date)>resolution));
    if(found)signals.push(evidence(found.mail,type,t));
   }
   topics.push({subject:t.subject,count:t.messages.length,clientCount:t.direct.length,agencyCount:t.agency.length,lastDate:latestExchange.date,latestClientDate:t.direct[0]?.date||null,latestAgencyDate:t.agency[0]?.date||null,summary:summarize(latest.preview,latest.subject),source:{url:latest.url,date:latest.date,from:latest.from,direction:clientMailDirection(latest)},needsContext:!t.direct.length});
  }
  topics.sort((a,b)=>Date.parse(b.lastDate)-Date.parse(a.lastDate));signals.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  const by=type=>signals.filter(s=>s.type===type),critical=by('critical'),followups=by('followup'),urgencies=by('urgent'),positive=by('positive'),resolved=by('resolved'),confirmations=by('confirmation');
  const recentDirect=direct.filter(m=>Date.parse(m.date)>=recentFrom),lastContact=direct[0]?.date||null;
  let state='neutral',label='Esito da confermare',verdict='Gli scambi mostrano attività e richieste, ma non bastano per concludere che il cliente sia soddisfatto.',nextStep='Concordare un breve punto con il cliente su consegne, aspettative e qualità del lavoro.';
  if(!recentDirect.length||direct.length<2){state='insufficient';label='Dati insufficienti';verdict=direct.length?'Pochi riscontri diretti o nessun messaggio recente: non è possibile valutare lo stato attuale del rapporto.':'Non sono disponibili messaggi diretti del cliente utili per un giudizio sul rapporto.';nextStep='Verificare l’ultimo contatto e raccogliere un riscontro diretto prima di formulare un giudizio.';}
  if(positive.length||resolved.length){state='positive';label='Segnali positivi';verdict=positive.length?'Il cliente esprime apprezzamento per il lavoro. Negli estratti recenti esaminati non risultano contestazioni esplicite ancora da chiarire.':'Il cliente conferma la risoluzione di un problema: è un segnale positivo sul punto specifico, non una valutazione di tutte le attività.';nextStep='Confermare con il cliente i prossimi passi e mantenere gli aggiornamenti concordati.';}
  if(followups.length||urgencies.length){state='attention';label='Da seguire';verdict='Il cliente chiede aggiornamenti o segnala urgenze. Serve un allineamento; questi segnali, da soli, non dimostrano che il lavoro sia svolto male.';nextStep='Rispondere ai punti evidenziati, chiarire cosa manca e concordare il prossimo aggiornamento con una data.';}
  if(critical.length){state='critical';label='Criticità esplicite';verdict='Il cliente esprime insoddisfazione o contesta un impegno. Negli estratti successivi non c’è una conferma esplicita della risoluzione.';nextStep='Ricostruire il problema con il team, concordare un intervento con il cliente e verificarne l’esito.';}
  const priority=(critical[0]||followups[0]||urgencies[0]);if(priority)nextStep='Priorità: «'+priority.subject+'». '+nextStep;
  const evidenceList=[...critical,...followups,...urgencies,...positive,...resolved,...confirmations].filter((s,i,all)=>all.findIndex(x=>x.id===s.id)===i).slice(0,6);
  const names=topics.slice(0,3).map(t=>'«'+t.subject+'»');
  const summary=names.length?'Il confronto recente riguarda '+names.join(', ')+'. '+(confirmations.length?'Ci sono conferme operative in '+confirmations.length+' scambi recenti. ':'')+(followups.length?'Sono presenti richieste di aggiornamento in '+followups.length+' scambi. ':'')+(urgencies.length?'Il cliente segnala urgenze da gestire. ':'')+(critical.length?'Sono presenti contestazioni esplicite da approfondire.':''): 'Nessuno scambio attribuito con sufficiente certezza. Le sole citazioni interne non sono usate per valutare il cliente.';
  return {client:client.name,state,label,verdict,nextStep,summary,topics:topics.slice(0,6),topicTotal:topics.length,evidence:evidenceList,counts:{direct:direct.length,agency:agency.length,internal:internal.length,recentDirect:recentDirect.length,followups:followups.length,urgent:urgencies.length,positive:positive.length,resolved:resolved.length,confirmations:confirmations.length,critical:critical.length},lastContact,confidence:recentDirect.length>=5?'media':recentDirect.length?'bassa':'insufficiente',checkedAt:now,windowDays:30,limitations:'Valutazione indicativa degli estratti email disponibili, non un voto al team. Non misura consegne rispettate, risultati, redditività o soddisfazione complessiva. Assenza di riscontri negativi non equivale a soddisfazione. WhatsApp non è incluso.'};
 });
}
