export async function resolveRequest(DB,owner,key){const d=await DB.prepare('SELECT payload,state FROM hub_drafts WHERE owner=? AND request_key=?').bind(owner,key).first();return d?{...normalizeClientRecord(JSON.parse(d.payload)),discarded:d.state==='discarded'}:known(key);}
export function requestSource(request,extra){return [...ANALYSIS.messages,...extra].find(m=>m.url===request.url||m.id===request.sourceId);}
export async function reviewInputHash(request,extra,DB=null,owner=null){
 let waRevision=null;if(request.channel==='WhatsApp'&&request.chatKey&&DB){await pruneWhatsApp(DB,owner);waRevision=(await DB.prepare('SELECT revision FROM hub_whatsapp_chats WHERE owner=? AND chat_key=?').bind(owner,request.chatKey).first())?.revision??null;}
 const source=requestSource(request,extra);const subject=normalizedSubject(source?.subject||'').toLocaleLowerCase('it');const latest=subject?[...ANALYSIS.messages,...extra].filter(m=>m.client===request.client&&normalizedSubject(m.subject).toLocaleLowerCase('it')===subject).map(m=>m.date||'').sort().at(-1):'';
 const fields=[request.title,request.note,request.url,request.client,latest||''];if(request.channel==='WhatsApp'&&request.chatKey)fields.push(waRevision);return sha(JSON.stringify(fields));
}
export async function cachedReviewRead(DB,owner,key,loader,ttl=86400000){
 const cached=await DB.prepare('SELECT payload,updated_at FROM hub_review_cache WHERE owner=? AND cache_key=?').bind(owner,key).first();if(cached&&Date.now()-cached.updated_at<ttl)return JSON.parse(cached.payload);
 const data=await loader();await DB.prepare('INSERT INTO hub_review_cache(owner,cache_key,payload,updated_at) VALUES(?,?,?,?) ON CONFLICT(owner,cache_key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(owner,key,JSON.stringify(data),Date.now()).run();return data;
}
export async function loadApprovalThread(request,extra,invoke){
 const source=requestSource(request,extra);
 if(request.channel!=='Email'||!source?.subject)return {messages:[],complete:false,note:'Scambio non leggibile automaticamente. L’approvazione può essere documentata da te nel dettaglio.'};
 let offset=0,more=true,pages=0,messages=[];const subject=normalizedSubject(source.subject).replace(/[\r\n]/g,' ').slice(0,160);
 const filter="receivedDateTime ge 2026-07-25T22:00:00Z and contains(subject,'"+subject.replace(/'/g,"''")+"')";
 while(more&&pages<12){
  const r=await invoke(OL,'list_messages',{filter,order_by:'receivedDateTime desc',top:50,skip:offset});if(r.status!=='success')throw Object.assign(Error(r.message||r.status),{data:r});const d=unwrap(r.result);
  if(!Array.isArray(d?.value))throw Error('Scambio email non riconosciuto');messages.push(...d.value.filter(m=>normalizedSubject(m.subject).toLocaleLowerCase('it')===normalizedSubject(source.subject).toLocaleLowerCase('it')));more=d.has_more===true;if(more&&(!Number.isInteger(d.next_from_index)||d.next_from_index<=offset))throw Error('Paginazione email non valida');offset=d.next_from_index;pages++;
 }
 const clients=messages.filter(m=>classifyMail(m).method==='Dominio mittente'&&classifyMail(m).client===request.client).sort((a,b)=>String(b.receivedDateTime).localeCompare(String(a.receivedDateTime)));
 const complete=!more&&clients.slice(0,3).every(m=>m.body?.content);
 messages=messages.sort((a,b)=>String(b.receivedDateTime).localeCompare(String(a.receivedDateTime))).slice(0,20).map(m=>({...m,body:m.body?{...m.body,content:String(m.body.content||'').slice(0,12000)}:null}));
 return {messages,complete};
}
export async function loadHistoryEstimate(request,invoke){
 const spec=historySpec(request);let cursor,items=[],pages=0;const seen=new Set();
 for(const query of spec.queries||[spec.query]){cursor=undefined;pages=0;seen.clear();do{const r=await invoke(CU,'clickup_search',{keywords:query,count:100,filters:{asset_types:['task'],task_statuses:['done','closed']},...(cursor?{cursor}:{})});if(r.status!=='success')throw Object.assign(Error(r.message||r.status),{data:r});const d=unwrap(r.result);if(!Array.isArray(d?.results))throw Error('Storico ClickUp non riconosciuto');items.push(...d.results);cursor=d.next_cursor;pages++;if(cursor&&(seen.has(cursor)||pages>=25))throw Error('Ricerca storica incompleta: restringere i criteri prima di stimare.');if(cursor)seen.add(cursor)}while(cursor);}
 const candidates=comparableTasks(request,items);const details=[];
 for(const {task} of candidates){const r=await invoke(CU,'clickup_get_task',{task_id:task.id});if(r.status!=='success')throw Object.assign(Error(r.message||r.status),{data:r});const d=unwrap(r.result);if(d?.id===task.id)details.push(d);}
 return {...estimateFromTasks(details,spec.query),partial:spec.partial,scope:spec.term};
}
export async function buildRequestReview(DB,owner,request,invoke,force=false){
 const extra=await incrementalMessages(DB,owner),hash=await reviewInputHash(request,extra,DB,owner);
 const saved=await DB.prepare('SELECT payload,input_hash,updated_at FROM hub_reviews WHERE owner=? AND request_key=?').bind(owner,request.key).first();
 if(saved&&saved.input_hash===hash&&Date.now()-saved.updated_at<600000&&!force&&!JSON.parse(saved.payload).sourceError&&!JSON.parse(saved.payload).estimateError)return {...JSON.parse(saved.payload),checkedAt:new Date(saved.updated_at).toISOString()};
 let decision,estimate,sourceError=null,estimateError=null,sourceConnection=null,estimateConnection=null;
 try{const source=requestSource(request,extra);const newest=extra.filter(m=>m.client===request.client&&normalizedSubject(m.subject).toLocaleLowerCase('it')===normalizedSubject(source?.subject).toLocaleLowerCase('it')).map(m=>m.date).sort().at(-1)||'';const thread=force?await loadApprovalThread(request,extra,invoke):await cachedReviewRead(DB,owner,'thread:'+await sha((source?.subject||request.key)+newest),()=>loadApprovalThread(request,extra,invoke),600000);decision=decisionFromMessages(request,thread.messages,thread.complete);if(!thread.complete){decision.approved=false;decision.lane='reply';decision.reason=thread.note||'Verifica dello scambio parziale: approvazione da confermare.';}}
 catch(e){sourceError=e.message;sourceConnection=e.data?.status==='reauthentication_required'?{status:e.data.status,chatGPTSignInPath:e.data.chatGPTSignInPath}:null;decision={lane:'reply',approved:false,reason:'Scambio email non verificato. Nessuna approvazione presunta.',evidence:null,complete:false};}
 try{const spec=historySpec(request);estimate=force?await loadHistoryEstimate(request,invoke):await cachedReviewRead(DB,owner,'history:'+await sha(JSON.stringify([spec.query,spec.revision,spec.partial,businessTokens(request.title).sort(),...(spec.queries?[spec.queries]:[])])),()=>loadHistoryEstimate(request,invoke),86400000);}
 catch(e){estimateError=e.message;estimateConnection=e.data?.status==='reauthentication_required'?{status:e.data.status,chatGPTSignInPath:e.data.chatGPTSignInPath}:null;estimate={available:false,basis:'missing',reason:'Storico non verificato: '+e.message,sampleCount:0,samples:[]};}
 const reply=draftClientReply(request,decision);const review={key:request.key,sourceError,estimateError,sourceConnection,estimateConnection,decision,estimate,reply,checkedAt:new Date().toISOString()};
 await DB.prepare('INSERT INTO hub_reviews(owner,request_key,input_hash,payload,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner,request_key) DO UPDATE SET input_hash=excluded.input_hash,payload=excluded.payload,updated_at=excluded.updated_at').bind(owner,request.key,hash,JSON.stringify(review),Date.now()).run();
 return review;
}
export async function requestThread(DB,owner,request,extra,invoke,force=false){
 const source=requestSource(request,extra);const newest=extra.filter(m=>m.client===request.client&&normalizedSubject(m.subject).toLocaleLowerCase('it')===normalizedSubject(source?.subject).toLocaleLowerCase('it')).map(m=>m.date).sort().at(-1)||'';
 return force?loadApprovalThread(request,extra,invoke):cachedReviewRead(DB,owner,'thread:'+await sha((source?.subject||request.key)+newest),()=>loadApprovalThread(request,extra,invoke),600000);
}
export function latestClientEmail(request,thread){
 const message=thread.messages.filter(m=>classifyMail(m).method==='Dominio mittente'&&classifyMail(m).client===request.client).sort((a,b)=>String(b.receivedDateTime).localeCompare(String(a.receivedDateTime)))[0];
 if(!message)return null;
 const body=String(message.body?.content||message.bodyPreview||'');
 const text=body.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi,'').replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,'&').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 return {id:message.id,subject:message.subject,from:message.sender?.emailAddress?.address||'',name:message.sender?.emailAddress?.name||'',date:message.receivedDateTime,url:message.web_link||message.display_url||request.url,text:text.slice(0,14000),truncated:text.length>14000||body.length>=12000};
}
