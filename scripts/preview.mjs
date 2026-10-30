// Local preview only. No provider bindings, credentials or external writes.
import {createServer} from 'node:http';
import worker from '../dist/server/index.js';
import {localDB} from './local-db.mjs';
const DB=await localDB();
const server=createServer(async(req,res)=>{
 try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-preview-fixture');const request=new Request('http://127.0.0.1:8767'+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,{DB},{props:{}});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('Local preview failed')}
});
server.listen(8767,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8767 · local database; app reads require the published Site.'));
