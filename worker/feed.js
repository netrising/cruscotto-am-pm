export function refreshLoop(run,{delay=600000,set=setTimeout,clear=clearTimeout,now=Date.now,changed=()=>{}}={}){
 let timer=null,pending=null,due=0;
 const kick=(...args)=>{if(pending)return pending;clear(timer);due=0;changed(due);pending=Promise.resolve().then(()=>run(...args)).finally(()=>{pending=null;due=now()+delay;timer=set(kick,delay);changed(due)});return pending};
 return {kick,resume:()=>{if(!pending&&now()>=due)return kick()},stop:()=>clear(timer)};
}
export function relatedTerms(a,b){
 if(a.client!==b.client||a.key===b.key||Math.abs(Date.parse(a.date)-Date.parse(b.date))>30*86400000)return [];
 const stop=new Set('della delle degli dalla dalle dello questa questo questi sono come anche cliente richiesta richieste verificare verifica aggiornamento aggiornamenti allineare inviare fare sito mail email whatsapp buongiorno grazie ciao avere nostro vostra vostro nella nelle per con che una del dei gli alla alle nel sul'.split(' '));
 const words=r=>new Set((r.title+' '+(r.summary||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]{4,}/g)?.filter(w=>!stop.has(w))||[]);
 const x=words(a),y=words(b),same=[...x].filter(w=>y.has(w));return same.length>=2?same:[];
}

export async function guardedReads(items,read,concurrency=2){let next=0,completed=0,error=null;await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{while(!error&&next<items.length){const item=items[next++];try{await read(item)}catch(e){error=error||e}finally{completed++}}}));return {completed,error,remaining:items.slice(next)};}
