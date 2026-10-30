import {italianInputToISO} from './shared.js';
export const DAILY_MINIMUM_MINUTES=435;
const RESOURCE_DAY=86400000;
const RESOURCE_FULL_ABSENCE_MINUTES=480;
export function resourceDate(ms){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));}
export function validResourceDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function moveResourceDate(value,n){return new Date(Date.parse(value+'T12:00:00Z')+n*RESOURCE_DAY).toISOString().slice(0,10);}
export function resourceMonday(value){if(!validResourceDate(value))throw Error('Data non valida');const dow=new Date(value+'T12:00:00Z').getUTCDay();return moveResourceDate(value,-((dow+6)%7));}
export function resourceWeekBounds(value){const start=resourceMonday(value),next=moveResourceDate(start,7),days=Array.from({length:7},(_,i)=>moveResourceDate(start,i));return {start,next,days,from:Date.parse(italianInputToISO(start+'T00:00')),to:Date.parse(italianInputToISO(next+'T00:00'))};}
export function resourceWindow(now){
 const end=resourceDate(Date.parse(now)),[year,month,day]=end.split('-').map(Number),target=new Date(Date.UTC(year,month-3,1)),last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 const start=target.toISOString().slice(0,8)+String(Math.min(day,last)).padStart(2,'0');return {start,end,firstWeek:resourceMonday(start),lastWeek:resourceMonday(end)};
}
const stamp=value=>typeof value==='number'||/^\d+$/.test(String(value))?Number(value):Date.parse(value);
export function absenceOnDays(tasks,days){
 const result=Object.fromEntries(days.map(d=>[d,[]]));
 for(const t of tasks){
  const status=typeof t.status==='string'?t.status:t.status?.status||'';if(!/^approvat[oa]$/i.test(status))continue;
  const s=stamp(t.start_date),e=stamp(t.due_date);if(!Number.isFinite(s)||!Number.isFinite(e)||e<s)continue;
  const first=resourceDate(s),last=resourceDate(e);if(last<days[0]||first>days.at(-1))continue;
  let working=0,cursor=first;while(cursor<=last&&working<401){if(![0,6].includes(new Date(cursor+'T12:00:00Z').getUTCDay()))working++;cursor=moveResourceDate(cursor,1);if(Date.parse(cursor)-Date.parse(first)>400*RESOURCE_DAY)break}
  const duration=Number(t.time_estimate),daily=working>0&&duration>0?duration/60000/working:null;
  const full=daily!==null&&daily>=RESOURCE_FULL_ABSENCE_MINUTES;
  for(const d of days)if(d>=first&&d<=last)result[d].push({id:t.id,url:t.url||'https://app.clickup.com/t/'+encodeURIComponent(t.id),full,minutes:daily,kind:full?'Assenza approvata':'Assenza approvata · durata parziale o da verificare'});
 }
 return result;
}
export function aggregateResourceWeek({week,entries,absences=[],overrides=[],now=new Date().toISOString(),ourTaskIds=[]}){
 const bounds=resourceWeekBounds(week),today=resourceDate(Date.parse(now)),our=new Set(ourTaskIds),hr=absenceOnDays(absences,bounds.days),seen=new Set();let invalid=0,running=0;
 const days=bounds.days.map(date=>({date,start:Date.parse(italianInputToISO(date+'T00:00')),end:Date.parse(italianInputToISO(moveResourceDate(date,1)+'T00:00')),loggedMs:0,ourMs:0,tasks:new Map(),intervals:[],warnings:[],absence:hr[date]}));
 for(const entry of entries){
  if(!entry.id){invalid++;continue}if(seen.has(String(entry.id)))continue;seen.add(String(entry.id));
  const start=stamp(entry.start),end=stamp(entry.end),duration=Number(entry.duration_ms);
  if(entry.end===null||entry.end===undefined||duration<0){running++;continue}
  if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(duration)||duration<0||end<=start||duration>end-start+1000||start>Date.parse(now)){invalid++;continue}
  for(const day of days){const a=Math.max(start,day.start,bounds.from),b=Math.min(end,day.end,bounds.to);if(b<=a)continue;const ms=duration*(b-a)/(end-start);day.loggedMs+=ms;if(our.has(String(entry.task?.id)))day.ourMs+=ms;day.intervals.push({start:a,end:b,id:entry.id});
   const key=entry.task?.id||'unassigned';const task=day.tasks.get(key)||{id:entry.task?.id||null,name:entry.task?.name||'Registrazione senza task',ms:0,url:entry.task?.id?'https://app.clickup.com/t/'+encodeURIComponent(entry.task.id):null,entries:[]};task.ms+=ms;task.entries.push({id:entry.id,start:entry.start,end:entry.end,ms,description:String(entry.description||'').slice(0,400)});day.tasks.set(key,task);
  }
 }
 for(const d of days){
  d.intervals.sort((a,b)=>a.start-b.start);let furthest=-Infinity;for(const interval of d.intervals){if(interval.start<furthest)d.warnings.push('Registrazioni sovrapposte');furthest=Math.max(furthest,interval.end)}d.warnings=[...new Set(d.warnings)];
  const override=overrides.find(o=>o.day===d.date),weekend=[0,6].includes(new Date(d.date+'T12:00:00Z').getUTCDay());
  let presence=override?.presence||'auto',target=null;
  if(presence==='auto')presence=(d.absence.some(a=>a.full)||(d.absence.length&&d.absence.every(a=>a.minutes!==null)&&d.absence.reduce((n,a)=>n+a.minutes,0)>=RESOURCE_FULL_ABSENCE_MINUTES))?'absent':d.absence.length?'partial':weekend?'nonworking':d.loggedMs>0?'recorded':'unknown';
  if(['present','recorded'].includes(presence))target=override?.target_minutes??DAILY_MINIMUM_MINUTES;
  if(presence==='partial'&&override?.target_minutes!==null&&override?.target_minutes!==undefined)target=override.target_minutes;
  let status='unknown',label='Presenza da confermare';
  if(presence==='absent'){status=d.loggedMs>0?'review':'absent';label=d.loggedMs>0?'Ore in giorno di assenza':'Assenza approvata / confermata'}
  else if(presence==='nonworking'){status=d.loggedMs>0?'review':'off';label=d.loggedMs>0?'Ore fuori calendario':'Non lavorativo'}
  else if(d.date>today){status='future';label='Da svolgere'}
  else if(d.date===today){status='today';label='Giornata in corso'}
  else if(presence==='partial'&&target===null){status='review';label='Permesso / durata da verificare'}
  else if(target!==null){status=d.loggedMs>=target*60000?'ok':'short';label=status==='ok'?'Soglia raggiunta':'Sotto soglia'}
  if(d.warnings.length){status='review';label='Sovrapposizioni da verificare'}
  d.presence=presence;d.presenceSource=override?'Rettifica nel cruscotto':d.absence.length?'ClickUp · Ferie e Permessi':presence==='recorded'?'Attività registrata; presenza desunta':weekend?'Calendario lun–ven':'Nessuna presenza verificabile';d.targetMinutes=target;d.missingMs=target===null?null:Math.max(0,target*60000-d.loggedMs);d.status=status;d.label=label;d.tasks=[...d.tasks.values()].sort((a,b)=>b.ms-a.ms);delete d.intervals;delete d.start;delete d.end;
 }
 return {week:bounds.start,days,totalMs:days.reduce((n,d)=>n+d.loggedMs,0),ourMs:days.reduce((n,d)=>n+d.ourMs,0),targetMinutes:days.filter(d=>d.date<today&&d.targetMinutes!==null&&!['absent','nonworking'].includes(d.presence)).reduce((n,d)=>n+d.targetMinutes,0),shortDays:days.filter(d=>d.status==='short').length,okDays:days.filter(d=>d.status==='ok').length,unconfirmedDays:days.filter(d=>['unknown','review'].includes(d.status)&&d.date<today).length,invalidEntries:invalid,runningEntries:running,checkedAt:now};
}
