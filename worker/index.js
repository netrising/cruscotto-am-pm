const CU = 'asdk_app_69431e6d26b88191b4029488aeb42f5b';
const OL = 'connector_4aaab2856305417b993eca9a216aaf6e';
const BASELINE = /* BASELINE */ null;
const PAGE = /* PAGE */ '';
const ANALYSIS = /* ANALYSIS */ null;
const UNASSIGNED = /* UNASSIGNED */ null;
/* SHARED */
/* SYNC */
const json = (data, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const fail = (message,status=400) => json({status:'invalid_request',message},status);
const validKey = k => typeof k==='string' && /^r[0-9a-z-]{1,80}$/.test(k);
const unwrap = r => {if(r?.structuredContent!==undefined)return r.structuredContent;for(const c of r?.content||[]){if(c.type==='text'){try{return JSON.parse(c.text)}catch{}}}return r};
const known = key => BASELINE.requests.find(r=>r.key===key);
const validTitle = n => typeof n==='string' && n.trim().length>1 && n.length<=250;
const sha = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export default {async fetch(req,env,ctx){
 try{return await handle(req,env,ctx)}catch(e){console.error('Account Hub request failed',new URL(req.url).pathname,e?.name);return json({status:'storage_or_server_error',message:'Operazione non confermata. Se stavi inviando un task, verifica ClickUp e il registro prima di riprovare.'},503)}
}};
async function handle(req,env,ctx){
 const url=new URL(req.url),path=url.pathname;
 if(path==='/'&&req.method==='GET')return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 if(path==='/favicon.ico')return new Response(null,{status:204});
 if(!path.startsWith('/api/')||req.method!=='POST')return new Response('Not found',{status:404});
 if(req.headers.get('Origin')!==url.origin)return fail('Origine non valida',403);
 const owner=req.headers.get('oai-authenticated-user-id');
 if(!owner)return json({status:'reauthentication_required',message:'Accedi con ChatGPT per aprire il tuo cruscotto.',chatGPTSignInPath:'/signin-with-chatgpt?return_to=%2F'},401);
 const text=await req.text();if(text.length>(path==='/api/whatsapp-import'?500000:20000))return fail('Richiesta troppo grande',413);
 let a;try{a=JSON.parse(text)}catch{return fail('JSON non valido')}
 if(!a||typeof a!=='object'||Array.isArray(a))return fail('Dati non validi');
 if(typeof a.client==='string')a.client=canonicalClient(a.client);
 if(path==='/api/baseline'){
  const extra=await incrementalMessages(env.DB,owner);
  return json({status:'success',...BASELINE,clients:combinedClients(extra),clientInsights:buildClientInsights(BASELINE.clients,[...ANALYSIS.messages,...extra]),requests:BASELINE.requests.map(r=>({...r,summary:summarize(r.note,r.title)}))});
 }
 if(path==='/api/analysis'){
  const skip=a.skip??0,query=typeof a.query==='string'?a.query.trim().toLocaleLowerCase('it'):'';
  if(!Number.isInteger(skip)||skip<0||skip>10000||query.length>150||(a.client!==undefined&&typeof a.client!=='string'))return fail('Filtri non validi');
  const extra=await incrementalMessages(env.DB,owner);
  const source=a.client==='__unassigned'?[...UNASSIGNED,...extra.filter(m=>m.group==='internal')]:[...ANALYSIS.messages,...extra.filter(m=>m.group==='client')];
  const matches=source.filter(m=>(!a.client||a.client==='__unassigned'||m.client===a.client)&&(!query||(m.subject+' '+m.from+' '+m.preview).toLocaleLowerCase('it').includes(query)));
  matches.sort((a,b)=>b.date.localeCompare(a.date));
  const groups={...ANALYSIS.groups};for(const m of extra)groups[m.group]=(groups[m.group]||0)+1;
  return json({status:'success',period:ANALYSIS.period,groups,totalRows:ANALYSIS.total+extra.length,total:matches.length,messages:matches.slice(skip,skip+50).map(m=>({...m,summary:m.summary||summarize(m.preview,m.subject)})),next:skip+50<matches.length?skip+50:null});
 }
 const needsDB=path.startsWith('/api/topic-')||path.startsWith('/api/resources-')||path.startsWith('/api/whatsapp-')||['/api/state','/api/draft','/api/check','/api/approve','/api/sync-mail','/api/review','/api/reply-draft','/api/client-approval','/api/request-mail'].includes(path);
 if(needsDB&&!env.DB)return json({status:'storage_unavailable',message:'Archivio non disponibile. Salvataggi e creazione task sono bloccati.'},503);
 if(path==='/api/topic-unlink'){if(!validKey(a.key))return fail('Richiesta non valida');await env.DB.prepare('DELETE FROM hub_topics WHERE owner=? AND request_key=?').bind(owner,a.key).run();return json({status:'success'});}
 if(path==='/api/topic-link'){
  if(!Array.isArray(a.keys)||a.keys.length<2||a.keys.length>20||a.keys.some(k=>!validKey(k))||typeof a.label!=='string'||a.label.trim().length<3||a.label.length>160)return fail('Scegli almeno due richieste e un argomento');
  const rows=await env.DB.prepare('SELECT * FROM hub_topics WHERE owner=?').bind(owner).all();const selectedRows=(rows.results||[]).filter(r=>a.keys.includes(r.request_key));const ids=new Set(selectedRows.map(r=>r.topic_id));const keys=[...new Set([...a.keys,...(rows.results||[]).filter(r=>ids.has(r.topic_id)).map(r=>r.request_key)])];
  const requests=await Promise.all(keys.map(k=>resolveRequest(env.DB,owner,k)));if(requests.some(r=>!r)||new Set(requests.map(r=>r.client)).size!==1)return fail('Collega richieste esistenti dello stesso cliente');
  const id=selectedRows[0]?.topic_id||crypto.randomUUID();for(const key of keys)await env.DB.prepare('INSERT INTO hub_topics(owner,request_key,topic_id,label) VALUES(?,?,?,?) ON CONFLICT(owner,request_key) DO UPDATE SET topic_id=excluded.topic_id,label=excluded.label').bind(owner,key,id,a.label.trim()).run();return json({status:'success'});
 }
 if(path==='/api/whatsapp-check'){await env.DB.prepare('INSERT INTO hub_whatsapp_imports(owner,import_id,checked_at,conversations,added,changed,requests) VALUES(?,?,?,?,?,?,?)').bind(owner,'check-'+crypto.randomUUID(),new Date().toISOString(),0,0,0,0).run();return json({status:'success'});}
 if(path==='/api/whatsapp-import'){try{return json(await importWhatsApp(env.DB,owner,a))}catch(e){return fail(e.message)}}
 if(path==='/api/whatsapp-state')return json(await whatsappState(env.DB,owner));
 if(path==='/api/whatsapp-chat'){if(typeof a.chatKey!=='string'||!/^[a-f0-9]{64}$/.test(a.chatKey))return fail('Conversazione non valida');const c=await env.DB.prepare('SELECT client FROM hub_whatsapp_chats WHERE owner=? AND chat_key=?').bind(owner,a.chatKey).first();if(!c)return fail('Conversazione non disponibile');return json(await whatsappThread(env.DB,owner,{chatKey:a.chatKey,client:c.client}));}
 if(path==='/api/whatsapp-thread'){if(!validKey(a.key))return fail('Richiesta non valida');const request=await resolveRequest(env.DB,owner,a.key);if(!request||request.channel!=='WhatsApp')return fail('Fonte WhatsApp non disponibile');return json(await whatsappThread(env.DB,owner,request));}
 if(path==='/api/state'){
  const [drafts,records]=await Promise.all([env.DB.prepare('SELECT request_key,payload,state FROM hub_drafts WHERE owner=?').bind(owner).all(),env.DB.prepare('SELECT request_key,state,result FROM hub_approvals WHERE owner=?').bind(owner).all()]);
  const sync=await env.DB.prepare('SELECT watermark,checked_at,window_upper FROM hub_sync WHERE owner=? AND source=?').bind(owner,'Email').first();
  const extra=await incrementalMessages(env.DB,owner);const savedReviews=await env.DB.prepare('SELECT request_key,input_hash,payload,updated_at FROM hub_reviews WHERE owner=?').bind(owner).all();const reviews=[];
  for(const row of savedReviews.results||[]){const request=await resolveRequest(env.DB,owner,row.request_key);if(!request)continue;const data=JSON.parse(row.payload);const stale=row.input_hash!==await reviewInputHash(request,extra,env.DB,owner)||Date.now()-row.updated_at>86400000||!!data.sourceError||!!data.estimateError;reviews.push({...data,stale,...(stale?{decision:{...data.decision,approved:false,lane:'reply',reason:data.sourceError?'Scambio Outlook non verificato: approvazione non presunta.':'Richiesta o scambio aggiornato: ripetere la verifica.'}}:{})});}
  const topics=await env.DB.prepare('SELECT request_key,topic_id,label FROM hub_topics WHERE owner=?').bind(owner).all();
  const replies=await env.DB.prepare('SELECT request_key,body,updated_at FROM hub_reply_drafts WHERE owner=?').bind(owner).all();
  return json({status:'success',drafts:(drafts.results||[]).map(d=>{const r=normalizeClientRecord(JSON.parse(d.payload));return {...d,payload:JSON.stringify({...r,summary:r.summary||summarize(r.note,r.title)})}}),records:records.results||[],sync,reviews,topics:topics.results||[],replies:replies.results||[],voice:VOICE_PROFILE});
 }
 if(path==='/api/reply-draft'){
  if(!validKey(a.key)||typeof a.body!=='string'||!a.body.trim()||a.body.length>10000)return fail('Bozza non valida');
  const request=await resolveRequest(env.DB,owner,a.key);if(!request||request.blocked)return fail('Richiesta non disponibile');
  await env.DB.prepare('INSERT INTO hub_reply_drafts(owner,request_key,body,updated_at) VALUES(?,?,?,?) ON CONFLICT(owner,request_key) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at').bind(owner,a.key,a.body,Date.now()).run();return json({status:'success',message:'Bozza salvata nel cruscotto. Nessuna email inviata.'});
 }
 if(path==='/api/client-approval'){
  if(!validKey(a.key)||a.confirmed!==true||typeof a.quote!=='string'||a.quote.trim().length<12||a.quote.length>500||typeof a.url!=='string')return fail('Indica fonte e passaggio dell’approvazione che hai verificato');
  try{if(new URL(a.url).protocol!=='https:')return fail('La fonte deve essere un collegamento HTTPS')}catch{return fail('Fonte non valida')}
  const request=await resolveRequest(env.DB,owner,a.key);if(!request||request.blocked||request.discarded)return fail('Richiesta non disponibile');
  const extra=await incrementalMessages(env.DB,owner),hash=await reviewInputHash(request,extra,env.DB,owner);const old=await env.DB.prepare('SELECT payload FROM hub_reviews WHERE owner=? AND request_key=?').bind(owner,a.key).first();const data=old?JSON.parse(old.payload):{key:a.key,estimate:{available:false,basis:'missing',samples:[]}};
  data.decision={lane:'operations',approved:true,verifiedBy:'user',reason:'Approvazione del cliente verificata manualmente da Giulia.',evidence:{author:'Verificata da Giulia',date:new Date().toISOString(),url:a.url,quote:a.quote.trim()},complete:true};data.reply=draftClientReply(request,data.decision);data.checkedAt=new Date().toISOString();
  await env.DB.prepare('INSERT INTO hub_reviews(owner,request_key,input_hash,payload,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner,request_key) DO UPDATE SET input_hash=excluded.input_hash,payload=excluded.payload,updated_at=excluded.updated_at').bind(owner,a.key,hash,JSON.stringify(data),Date.now()).run();return json({status:'success',review:data});
 }
 if(path==='/api/draft'){
  if(!validKey(a.key)||known(a.key)?.blocked)return fail('Richiesta non modificabile');
  if(await env.DB.prepare('SELECT request_key FROM hub_approvals WHERE owner=? AND request_key=?').bind(owner,a.key).first())return fail('Richiesta già inviata o con esito da verificare',409);
  if(!validTitle(a.title)||!BASELINE.clients.some(c=>c.name===a.client)||typeof a.note!=='string'||a.note.length>6000||!['Email','WhatsApp'].includes(a.channel)||typeof a.url!=='string'||a.url.length>3000||typeof a.date!=='string'||a.date.length>40||!['draft','discarded'].includes(a.state))return fail('Controlla cliente, titolo, testo e fonte');
  if(a.url){try{if(new URL(a.url).protocol!=='https:')return fail('La fonte deve essere un collegamento HTTPS')}catch{return fail('Collegamento fonte non valido')}}
  const previous=await env.DB.prepare('SELECT payload FROM hub_drafts WHERE owner=? AND request_key=?').bind(owner,a.key).first();const provenance=previous?JSON.parse(previous.payload):{};
  const payload={...(provenance.chatKey?{chatKey:provenance.chatKey,sourceMessageId:provenance.sourceMessageId}:{}),...(provenance.sourceId?{sourceId:provenance.sourceId}:{}),key:a.key,client:a.client,title:a.title.trim(),note:a.note,summary:summarize(a.note,a.title),date:a.date,url:a.url,channel:a.channel,status:'Da verificare',blocked:false};
  await env.DB.prepare('INSERT INTO hub_drafts(owner,request_key,payload,state) VALUES(?,?,?,?) ON CONFLICT(owner,request_key) DO UPDATE SET payload=excluded.payload,state=excluded.state').bind(owner,a.key,JSON.stringify(payload),a.state).run();
  return json({status:'success',draft:payload,state:a.state});
 }
 const binding=ctx.props?.CONNECTORS;
 if(!binding?.invoke)return json({status:'binding_unavailable',message:'Le connessioni alle app non sono disponibili. L’analisi storica resta consultabile.'},503);
 const invoke=async(c,action,args)=>{try{const r=await binding.invoke(c,action,args);if(!r||typeof r.status!=='string')return {status:'upstream_error',message:'Risposta del servizio non riconosciuta.'};if(r.status==='reauthentication_required')return {...r,chatGPTSignInPath:'/signin-with-chatgpt?return_to=%2F'};return r}catch{return {status:'upstream_error',message:'Esito non confermato. Verifica il servizio prima di riprovare.'}}};
 if(path.startsWith('/api/topic-')||path.startsWith('/api/resources-')){
  if(path!=='/api/resources-context'&&path!=='/api/resources-discover'&&(typeof a.id!=='string'||!/^\d{1,30}$/.test(a.id)))return fail('Risorsa non valida');
  try{
   if(path==='/api/resources-context')return json(await resourceContext(env.DB,owner,invoke));
   if(path==='/api/resources-discover')return json(await discoverResources(env.DB,owner,invoke,a.reset===true));
   if(path==='/api/resources-profile'){if(typeof a.included!=='boolean'||typeof a.shared!=='boolean')return fail('Selezione risorsa non valida');return json(await saveResourceProfile(env.DB,owner,invoke,a));}
   if(path==='/api/resources-week'){if(!validResourceDate(a.week))return fail('Settimana non valida');return json(await resourceWeekData(env.DB,owner,invoke,a));}
   if(path==='/api/resources-day'){if(!validResourceDate(a.day)||!['auto','present','absent','nonworking','unknown','partial'].includes(a.presence)||(a.target_minutes!==undefined&&a.target_minutes!==null&&(!Number.isInteger(a.target_minutes)||a.target_minutes<0||a.target_minutes>1440))||(a.presence==='partial'&&a.target_minutes==null))return fail('Presenza o soglia non valida');return json(await saveResourceDay(env.DB,owner,invoke,a));}
  }catch(e){return json({status:e.data?.status||'resource_read_error',message:e.message,...(e.data?.chatGPTSignInPath?{chatGPTSignInPath:e.data.chatGPTSignInPath}:{})},503);}
 }
 if(path==='/api/request-mail'){
  if(!validKey(a.key))return fail('Richiesta non valida');const request=await resolveRequest(env.DB,owner,a.key);if(!request||request.discarded)return fail('Richiesta non disponibile');
  if(request.channel!=='Email')return json({status:'success',email:null,complete:false,note:'Questa richiesta proviene da WhatsApp.'});
  try{const extra=await incrementalMessages(env.DB,owner);const thread=await requestThread(env.DB,owner,request,extra,invoke,a.force===true);return json({status:'success',email:latestClientEmail(request,thread),complete:thread.complete,note:thread.note||'Nessuna email del cliente trovata in questo scambio.'});}
  catch(e){return json({status:e.data?.status||'upstream_error',message:'Ultima email non disponibile: '+e.message,...(e.data?.chatGPTSignInPath?{chatGPTSignInPath:e.data.chatGPTSignInPath}:{})},502);}
 }
 if(path==='/api/review'){
  if(!validKey(a.key))return fail('Richiesta non valida');const request=await resolveRequest(env.DB,owner,a.key);if(!request||request.blocked||request.discarded)return fail('Richiesta non disponibile');
  return json({status:'success',review:await buildRequestReview(env.DB,owner,request,invoke,a.force===true)});
 }
 if(path==='/api/sync-mail')return json(await syncMail(env.DB,owner,invoke));
 if(path==='/api/mail'){
  const skip=a.skip??0;if(!Number.isInteger(skip)||skip<0||skip>10000)return fail('Pagina non valida');
  return json(await invoke(OL,'list_messages',{order_by:'receivedDateTime desc',top:50,skip}));
 }
 if(path==='/api/hierarchy'){
  if(a.cursor!==undefined&&(typeof a.cursor!=='string'||a.cursor.length>1000))return fail('Pagina non valida');
  return json(await invoke(CU,'clickup_get_workspace_hierarchy',{max_depth:'2',limit:50,...(a.cursor?{cursor:a.cursor}:{})}));
 }
 if(path==='/api/members')return json(await invoke(CU,'clickup_get_workspace_members',{}));
 if(path==='/api/check'){
  if(!validKey(a.key)||!validTitle(a.name)||known(a.key)?.blocked||typeof a.query!=='string'||a.query.trim().length<2||a.query.length>150)return fail('Inserisci almeno due caratteri per cercare in ClickUp');
  let cursor,results=[],pages=0;const seen=new Set();
  do{
   const r=await invoke(CU,'clickup_search',{keywords:a.query.trim(),count:100,filters:{asset_types:['task']},...(cursor?{cursor}:{})});
   if(r.status!=='success')return json(r);
   const d=unwrap(r.result);if(!Array.isArray(d?.results))return json({status:'upstream_error',message:'Risultati ClickUp non riconosciuti. Impossibile confermare la verifica.'},502);
   results.push(...d.results);cursor=d.next_cursor;pages++;
   if(cursor&&(seen.has(cursor)||pages>=20))return json({status:'search_incomplete',message:'Troppi risultati: usa una ricerca più specifica. Nessuna approvazione è stata sbloccata.'},409);
   if(cursor)seen.add(cursor);
  }while(cursor);
  const receipt=crypto.randomUUID();await env.DB.prepare('INSERT INTO hub_checks(owner,receipt,request_key,title,created_at) VALUES(?,?,?,?,?)').bind(owner,receipt,a.key,a.name.trim(),Date.now()).run();
  return json({status:'success',receipt,results,query:a.query.trim()});
 }
 if(path==='/api/approve'){
  if(!validKey(a.key)||known(a.key)?.blocked||!validTitle(a.name)||typeof a.list_id!=='string'||!/^\d{1,30}$/.test(a.list_id)||typeof a.note!=='string'||a.note.length>6000||!Array.isArray(a.assignees)||a.assignees.length!==1||!a.assignees.every(v=>typeof v==='string'&&/^\d{1,30}$/.test(v))||!['low','normal','high','urgent'].includes(a.priority)||a.duplicatesReviewed!==true||a.approved!==true||typeof a.receipt!=='string')return fail('Controlla titolo, lista, responsabile e approvazione esplicita');
  const check=await env.DB.prepare('SELECT title,created_at FROM hub_checks WHERE owner=? AND receipt=? AND request_key=?').bind(owner,a.receipt,a.key).first();
  if(!check||check.title!==a.name.trim()||Date.now()-check.created_at>1800000)return fail('Ripeti la ricerca ClickUp prima di approvare',409);
  const draft=await env.DB.prepare('SELECT payload,state FROM hub_drafts WHERE owner=? AND request_key=?').bind(owner,a.key).first();
  if(draft?.state==='discarded')return fail('Richiesta scartata',409);
  const request=draft?JSON.parse(draft.payload):known(a.key);if(!request)return fail('Salva prima la richiesta');
  const review=await env.DB.prepare('SELECT input_hash,payload,updated_at FROM hub_reviews WHERE owner=? AND request_key=?').bind(owner,a.key).first();const extra=await incrementalMessages(env.DB,owner);
  if(!review||!JSON.parse(review.payload).decision?.approved||review.input_hash!==await reviewInputHash(request,extra,env.DB,owner)||Date.now()-review.updated_at>86400000)return fail('Verifica e documenta prima l’approvazione del cliente nello scambio. La verifica duplicati resta obbligatoria.',409);
  const fingerprint=await sha([request.url||a.key,a.name.trim().toLocaleLowerCase('it'),a.list_id].join('\n'));
  const inserted=await env.DB.prepare('INSERT OR IGNORE INTO hub_approvals(owner,request_key,fingerprint,state,payload,result) VALUES(?,?,?,?,?,?)').bind(owner,a.key,fingerprint,'pending',JSON.stringify(a),null).run();
  if(!inserted.meta?.changes)return json({status:'already_submitted',message:'Richiesta già inviata o con esito da verificare. Controlla il registro e ClickUp; nessun nuovo task è stato creato.'},409);
  const r=await invoke(CU,'clickup_create_task',{name:a.name.trim(),list_id:a.list_id,assignees:a.assignees,priority:a.priority,markdown_description:a.note});
  const created=r.status==='success'&&unwrap(r.result)?.success!==false;
  await env.DB.prepare('UPDATE hub_approvals SET state=?,result=? WHERE owner=? AND request_key=?').bind(created?'sent':'uncertain',JSON.stringify(r),owner,a.key).run();
  return json(!created&&r.status==='success'?{status:'upstream_error',message:'ClickUp non ha confermato la creazione. Verifica il registro e ClickUp.',result:r.result}:r);
 }
 return fail('Operazione sconosciuta',404);
}
