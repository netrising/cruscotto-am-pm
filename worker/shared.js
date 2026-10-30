export const COMBINED_TRAVEL_CLIENT='VIP Riccione / Shuttle Italy Airport';
export function canonicalClient(name){return ['VIP Riccione','Shuttle Italy Airport','Shuttle Italy'].includes(name)?COMBINED_TRAVEL_CLIENT:name;}
export function normalizeClientRecord(row){const client=canonicalClient(row.client);return {...row,client,...(client!==row.client?{originalClient:row.originalClient||row.client}:{})};}
export function mergeClientRows(rows){const merged=new Map();for(const row of rows){const name=canonicalClient(row.name),old=merged.get(name);if(old){for(const key of ['count','domain','calendar','subjects'])old[key]=(old[key]||0)+(row[key]||0);}else merged.set(name,{...row,name});}return [...merged.values()];}
// Shared presentation helpers: summaries are extractive, never inferred tasks.
export function cleanMessage(value=''){
 let s=String(value).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi,'').replace(/<br\s*\/?>|<\/p>|<\/div>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&');
 s=s.split(/\n\s*(?:\*\*)?(?:Da:|From:|Inviato:|Sent:|Il giorno .+ha scritto:|On .+wrote:|Privacy Policy:)|\n\s*>/i)[0];
 s=s.replace(/(^|\n)\s*(?:[Cc]iao|[Bb]uongiorno|[Bb]uon pomeriggio|[Bb]uonasera|[Ss]alve)(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)?[!,]\s*/g,'$1');
 return s.split('\n').filter(line=>!/^\s*(?:buongiorno|buon pomeriggio|buonasera|ciao|salve|cordiali saluti|grazie(?: mille| ancora)?)[,! .]*$/i.test(line.trim())&&!/^\s*(?:https?:|tel[.:]|cell[.:]|sent by|microsoft teams|riunione di microsoft|_{3,}|-{3,})/i.test(line)).join(' ').replace(/https?:\/\/\S+/g,'').replace(/[*_#|]+/g,' ').replace(/\s+/g,' ').trim();
}
export function summarize(value='',title='Richiesta'){
 const s=cleanMessage(value);if(!s)return 'Messaggio relativo a «'+String(title).trim()+'». Contenuto da verificare nella fonte.';
 const sentences=s.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[s];
 const action=sentences.findIndex(x=>/\b(chied|richiest|modific|aggiorn|inviar|conferm|verific|aggiung|corregg|bisogno|potet|potrest|riusc|vorrei|vorrem|necess|proced|prepar|realizz|fissar|organizz|sollecit)/i.test(x));
 const extract=sentences.slice(action<0?0:action,action<0?2:action+2).join(' ').trim();
 return extract.length<=380?extract:extract.slice(0,377).replace(/\s+\S*$/,'')+'…';
}
export function formatItalianDate(value,withTime=true){
 if(!value)return 'Data non disponibile';const s=String(value);
 const local=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?$/);
 if(local)return local[3]+'/'+local[2]+'/'+local[1]+(withTime&&local[4]?' '+local[4]+':'+local[5]:'');
 const date=new Date(s);if(!Number.isFinite(date.getTime()))return 'Data non disponibile';
 return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}:{})}).format(date).replace(',','');
}
export function italianDateInput(value=new Date().toISOString()){
 const date=new Date(value);const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function italianInputToISO(value){
 const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);if(!m)throw Error('Data non valida');
 const target=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]);let guess=target;
 for(let i=0;i<3;i++){const local=italianDateInput(new Date(guess).toISOString());const shown=Date.parse(local+':00Z');guess+=target-shown;}
 const result=new Date(guess).toISOString();if(italianDateInput(result)!==value)throw Error('Questo orario non esiste nel fuso italiano. Scegli un altro orario.');return result;
}
export function classifyMail(message){
 const from=String(message.sender?.emailAddress?.address||'').toLowerCase(),subject=message.subject||'';
 if(!message.id||!subject||!from||!message.receivedDateTime)return {group:'empty',client:'',method:'Dati incompleti'};
 if(from==='g.balzi@netrising.com')return {group:'sent',client:'',method:'Inviata da Giulia'};
 if(from.startsWith('microsoftexchange')||/^Non recapitabil[ei]:/i.test(subject))return {group:'bounce',client:'',method:'Mancato recapito'};
 const domains={'Tubò / Aertecnica':['aertecnica.com'],'Malaguti / Cangeo':['malagutisrl.com','cangeogroup.com'],'Ser.mac':['sermac.org'],'F.lli Vitali':['fratellivitali.com'],'Pianeta Sicurezza':['pianetasicurezza.it'],'F.lli Righini':['righiniravenna.it'],'Aran':['arancesena.it','aranfaenza.it','aranravenna.it','aranworld.it'],'Riati':['riati.it'],'VIP Riccione':['vipriccione.it'],'Shuttle Italy Airport':['shuttleitalyairport.it']};
 const names=Object.keys(domains);let client=names.find(n=>domains[n].includes(from.split('@')[1]));
 if(client)return {group:'client',client:canonicalClient(client),method:'Dominio mittente'};
 if(!/@(netrising\.com|custom\.it)$/i.test(from))return {group:'other',client:'',method:'Mittente non attribuito'};
 const recipients=[...(message.toRecipients||[]),...(message.ccRecipients||[])].map(r=>r.emailAddress?.address?.toLowerCase().split('@')[1]);
 const matches=[...new Set(names.filter(n=>domains[n].some(d=>recipients.includes(d))).map(canonicalClient))];if(matches.length===1)return {group:'client',client:matches[0],method:'Destinatari del cliente'};
 const patterns=[/\b(tubo|aertecnica|robo)\b/i,/\b(malaguti|cangeo|toorx|bardux)\b/i,/\bser[\s.]?mac\b/i,/\bvitali\b/i,/\bpianeta\s*sicurezza\b/i,/\brighini\b/i,/\baran\b/i,/\briati\b/i,/\bvip(\s+riccione)?\b/i,/\bshuttle\s*italy(\s*airport)?\b/i];
 const normalized=subject.normalize('NFD').replace(/\p{M}/gu,'');const possible=[...new Set(names.filter((n,i)=>patterns[i].test(normalized)).map(canonicalClient))];
 return possible.length===1?{group:'client',client:possible[0],method:'Riferimento nell’oggetto'}:{group:'internal',client:'',method:'Cliente non determinato'};
}
export function isRequestMessage(subject,excerpt){
 if(/^(Accettata|Rifiutata|Annullata|Provvisorio):/i.test(subject)||/\b(?:Microsoft Teams meeting|Riunione di Microsoft Teams)\b/i.test(excerpt))return false;
 if(/\bnon\s+(?:procedere|procediamo|proseguire|avviare)\b/i.test(cleanMessage(excerpt)))return false;
 return /\b(chiedo|chiediamo|puoi|richiest[ae]|modific\w*|aggiorn\w*|inviar[ec]\w*|inviarc\w*|confermar[ec]\w*|verificar[ei]|aggiung\w*|corregg\w*|bisogno|potet[ei]|potrest[ei]|riuscit[ei]|vorrei|vorremmo|necessit\w*|proceder[ei]|preparar[ei]|realizzar[ei]|fissar[ei]|organizzar[ei]|sollecito)\b/i.test(cleanMessage(excerpt));
}
