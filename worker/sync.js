// Each request processes one bounded page. Only a completed window advances the watermark.
export async function syncMail(DB,owner,invoke){
 const initial=ANALYSIS.period.cutoffUTC,now=new Date().toISOString(),token=crypto.randomUUID(),clock=Date.now();
 await DB.prepare('INSERT OR IGNORE INTO hub_sync(owner,source,watermark) VALUES(?,?,?)').bind(owner,'Email',initial).run();
 const lock=await DB.prepare('UPDATE hub_sync SET lock_token=?,lock_until=? WHERE owner=? AND source=? AND lock_until<?').bind(token,clock+120000,owner,'Email',clock).run();
 if(!lock.meta?.changes)return {status:'success',busy:true,more:true};
 try{
  let state=await DB.prepare('SELECT * FROM hub_sync WHERE owner=? AND source=?').bind(owner,'Email').first();
  if(!state.window_upper){
   const lower=new Date(Math.max(Date.parse(initial),Date.parse(state.watermark)-300000)).toISOString();
   await DB.prepare('UPDATE hub_sync SET window_lower=?,window_upper=?,next_index=? WHERE owner=? AND source=? AND lock_token=?').bind(lower,now,0,owner,'Email',token).run();
   state={...state,window_lower:lower,window_upper:now,next_index:0};
  }
  const r=await invoke(OL,'list_messages',{filter:`receivedDateTime ge ${state.window_lower} and receivedDateTime lt ${state.window_upper}`,order_by:'receivedDateTime desc',top:50,skip:state.next_index});
  if(r.status!=='success')return r;
  const data=unwrap(r.result);if(!Array.isArray(data?.value))return {status:'upstream_error',message:'Risposta Outlook non riconosciuta. Il punto di sincronizzazione è stato conservato.'};
  const more=data.has_more===true;
  if(more&&(!Number.isInteger(data.next_from_index)||data.next_from_index<=state.next_index||data.next_from_index>10000))return {status:'pagination_error',message:'Paginazione Outlook non valida. Sincronizzazione sospesa senza perdere il punto raggiunto.'};
  let added=0,newRequests=0,incomplete=0;
  for(const m of data.value){
   if(!m?.id){incomplete++;continue}
   if(m.receivedDateTime&&Date.parse(m.receivedDateTime)<Date.parse(initial))continue;
   const classification=classifyMail(m);const body=cleanMessage(m.body?.content||m.bodyPreview||'').slice(0,6000);
   const excerpt=body||m.bodyPreview||'',summary=summarize(excerpt,m.subject||'Email senza oggetto');
   const calendar=/^(Accettata|Rifiutata|Provvisorio|Annullata):/i.test(m.subject||'')||/Microsoft Teams meeting|Riunione di Microsoft Teams/i.test(m.body?.content||'');
   const mail={id:m.id,client:classification.client,subject:m.subject||'Email senza oggetto',from:m.sender?.emailAddress?.address||'',sender:m.sender?.emailAddress?.name||'',date:m.receivedDateTime||'',url:m.web_link||m.display_url||'',preview:m.bodyPreview||'',summary,method:classification.method,calendar};
   const existing=await DB.prepare('SELECT group_name FROM hub_mail WHERE owner=? AND source_id=?').bind(owner,m.id).first();
   if(!existing||existing.group_name==='empty'){
    await DB.prepare('INSERT INTO hub_mail(owner,source_id,received_at,group_name,client,payload) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,source_id) DO UPDATE SET received_at=excluded.received_at,group_name=excluded.group_name,client=excluded.client,payload=excluded.payload WHERE hub_mail.group_name=?').bind(owner,m.id,mail.date,classification.group,classification.client,JSON.stringify(mail),'empty').run();
    if(!existing)added++;
   }
   if(classification.group==='empty'){incomplete++;continue}
   if(classification.group==='client'&&!calendar&&isRequestMessage(m.subject||'',excerpt)){
    const key='rmail'+(await sha(m.id)).slice(0,48);
    const draft={key,client:classification.client,title:String(m.subject).replace(/^(?:(?:re|r|i|fw|fwd):\s*)+/gi,'').slice(0,250),note:excerpt||summary,summary,date:mail.date,url:mail.url,channel:'Email',status:'Possibile richiesta · da verificare',blocked:false,automatic:true,sourceId:m.id};
    const inserted=await DB.prepare('INSERT OR IGNORE INTO hub_drafts(owner,request_key,payload,state) VALUES(?,?,?,?)').bind(owner,key,JSON.stringify(draft),'draft').run();
    if(inserted.meta?.changes)newRequests++;
   }
  }
  const checkpoint=more
   ?await DB.prepare('UPDATE hub_sync SET next_index=? WHERE owner=? AND source=? AND lock_token=?').bind(data.next_from_index,owner,'Email',token).run()
   :await DB.prepare('UPDATE hub_sync SET watermark=?,checked_at=?,window_lower=NULL,window_upper=NULL,next_index=? WHERE owner=? AND source=? AND lock_token=?').bind(state.window_upper,new Date().toISOString(),0,owner,'Email',token).run();
  if(!checkpoint.meta?.changes)return {status:'success',busy:true,more:true,added,newRequests,incomplete};
  const catchup=!more&&Date.parse(now)-Date.parse(state.window_upper)>60000;
  return {status:'success',more:more||catchup,added,newRequests,incomplete,checkedAt:more?state.checked_at:new Date().toISOString()};
 }finally{
  await DB.prepare('UPDATE hub_sync SET lock_token=NULL,lock_until=? WHERE owner=? AND source=? AND lock_token=?').bind(0,owner,'Email',token).run();
 }
}
export async function incrementalMessages(DB,owner){
 if(!DB)return [];
 const r=await DB.prepare('SELECT payload,group_name FROM hub_mail WHERE owner=? ORDER BY received_at DESC').bind(owner).all();
 return (r.results||[]).map(row=>({...normalizeClientRecord(JSON.parse(row.payload)),group:row.group_name}));
}
export function combinedClients(extra){
 return BASELINE.clients.map(client=>{
  const rows=extra.filter(m=>m.group==='client'&&m.client===client.name);
  return {...client,count:client.count+rows.length,domain:client.domain+rows.filter(m=>m.method==='Dominio mittente').length,calendar:client.calendar+rows.filter(m=>m.calendar).length,subjects:new Set([...ANALYSIS.messages.filter(m=>m.client===client.name),...rows].map(m=>m.subject.replace(/^(?:(?:re|r|i|fw|fwd):\s*)+/gi,'').trim().toLowerCase())).size};
 }).sort((a,b)=>b.count-a.count);
}
