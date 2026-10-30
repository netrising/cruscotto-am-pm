// Local verification adapter. Production uses the D1 binding provided by Sites.
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
export async function localDB(){
 const sqlite=new DatabaseSync(':memory:');
 const journal=JSON.parse(await readFile(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
 for(const entry of journal.entries)sqlite.exec(await readFile(new URL('../drizzle/'+entry.tag+'.sql',import.meta.url),'utf8'));
 return {
  sqlite,
  prepare(sql){
   const statement=sqlite.prepare(sql);
   return {
    bind(...args){
     return {
      async all(){return {results:statement.all(...args)}},
      async first(){return statement.get(...args)||null},
      async run(){const r=statement.run(...args);return {meta:{changes:Number(r.changes)}}}
     };
    }
   };
  }
 };
}
