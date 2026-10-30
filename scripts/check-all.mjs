// Export helper: local fixture tests only, no real provider writes.
import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
for(const file of (await readdir(new URL('scripts/',root))).filter(f=>/^verify(?:-.*)?\.mjs$/.test(f)).sort()){
 const result=spawnSync(process.execPath,['scripts/'+file],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
