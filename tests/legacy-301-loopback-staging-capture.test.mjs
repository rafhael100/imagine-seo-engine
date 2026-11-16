import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,writeFile,readFile,stat,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {captureLoopbackStaging301} from
  '../src/legacy-301-loopback-staging-capture.mjs';

const cli=fileURLToPath(new URL('../scripts/capture-staging-301-loopback.mjs',import.meta.url));
function manifest(){
 return {
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:'https://example.test/',
  legacyUrls:['http://www.example.test/','https://www.example.test/en-us/'],
  targetRoutes:['/','/en/'],
  candidates:[
   {fromUrl:'http://www.example.test/',toPath:'/',status:301},
   {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
 };
}
async function serveLocal(mode='valid'){
 const seen=[];
 const server=http.createServer((req,res)=>{
  seen.push({host:req.headers.host,proto:req.headers['x-forwarded-proto'],
    path:req.url,method:req.method});
  const old=req.headers.host==='www.example.test';
  const location=req.url==='/en-us/'?'https://example.test/en/':
    'https://example.test/';
  if(old){
   res.writeHead(mode==='temporary'?302:301,{
    Location:mode==='external'?'https://external.test/private':location
   });res.end();return;
  }
  if(req.headers.host==='example.test'&&
     req.headers['x-forwarded-proto']==='https'&&
     ['/','/en/'].includes(req.url)){
   res.writeHead(mode==='double-hop'?302:200,mode==='double-hop'?{
    Location:'https://another.test/'}:{});res.end();return;
  }
  res.writeHead(404);res.end();
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 return {server,port:server.address().port,seen};
}
async function stop(server){await new Promise(resolve=>server.close(resolve));}
const env=()=>({
 SEO_F138_LOOPBACK_STAGING:'YES_I_CONTROL_THIS_LOOPBACK',APP_ENV:'testing'
});
async function allowed(fn){
 const previous={...process.env};
 try{
  Object.assign(process.env,env());
  return await fn();
 }finally{
  for(const name of ['SEO_F138_LOOPBACK_STAGING','APP_ENV']){
   if(previous[name]===undefined)delete process.env[name];
   else process.env[name]=previous[name];
  }
 }
}
function runCli(args){
 return new Promise((resolve,reject)=>{
  const cp=spawn(process.execPath,[cli,...args],{
    env:{...process.env,...env()},cwd:process.cwd(),stdio:['ignore','pipe','pipe']
  });
  let stdout='',stderr='';
  cp.stdout.on('data',b=>stdout+=b.toString());
  cp.stderr.on('data',b=>stderr+=b.toString());
  cp.once('error',reject);
  cp.once('close',status=>resolve({status,stdout,stderr}));
 });
}
test('F138 only connects to 127.0.0.1 and captures real HEAD 301, never DNS/public URLs',async()=>{
 const {server,port,seen}=await serveLocal();
 try{
  const result=await allowed(()=>captureLoopbackStaging301({
   migrationInput:manifest(),stagingPort:port,timeoutMs:2000
  }));
  assert.equal(result.review.reviewStatus,'human_http_staging_review_required');
  assert.equal(result.review.summary.matched301ToCanonical,2);
  assert.equal(result.capture.observations.length,2);
  assert.equal(seen.length,4);
  assert.ok(seen.every(v=>v.method==='HEAD'));
  assert.deepEqual(seen.map(v=>v.host),[
   'www.example.test','example.test','www.example.test','example.test'
  ]);
  assert.deepEqual(seen.map(v=>v.proto),['http','https','https','https']);
 }finally{await stop(server);}
});
test('F138 blocks external Location without ever requesting the external address',async()=>{
 const {server,port,seen}=await serveLocal('external');
 try{
  const result=await allowed(()=>captureLoopbackStaging301({
   migrationInput:manifest(),stagingPort:port,timeoutMs:2000
  }));
  assert.equal(result.review.reviewStatus,'blocked');
  assert.equal(result.review.summary.wrongLocationOrFinalUrlCount,2);
  assert.equal(seen.length,4);
  assert.ok(seen.every(v=>v.host==='www.example.test'||v.host==='example.test'));
  assert.doesNotMatch(JSON.stringify(result.review),/external\.test|example\.test/);
 }finally{await stop(server);}
});
test('F138 rejects missing explicit staging opt-in and bounded port',async()=>{
 const {server,port,seen}=await serveLocal();
 try{
  await assert.rejects(captureLoopbackStaging301({
   migrationInput:manifest(),stagingPort:port,timeoutMs:2000
  }),/SEO F138/);
  await allowed(async()=>{
   await assert.rejects(captureLoopbackStaging301({
    migrationInput:manifest(),stagingPort:80,timeoutMs:2000
   }),/SEO F138/);
   await assert.rejects(captureLoopbackStaging301({
    migrationInput:manifest(),stagingPort:port,timeoutMs:99999
   }),/SEO F138/);
  });
  assert.equal(seen.length,0);
 }finally{await stop(server);}
});
test('F138 CLI writes private 0600 evidence outside Git and emits only sanitized status',async()=>{
 const {server,port}=await serveLocal();
 const dir=await mkdtemp(join(tmpdir(),'seo-f138-test-'));
 try{
  const source=join(dir,'private-manifest.json');
  const output=join(dir,'private-http-receipts.json');
  await writeFile(source,JSON.stringify(manifest()),{mode:0o600});
  const response=await runCli([
   '--manifest',source,'--out',output,'--port',String(port),
   '--enable-loopback-probe'
  ]);
  assert.equal(response.status,0,response.stderr);
  assert.equal(response.stderr,'');
  const clean=JSON.parse(response.stdout);
  assert.equal(clean.summary.matched301ToCanonical,2);
  assert.equal(clean.stagingOriginVerified,undefined);
  assert.doesNotMatch(response.stdout,/example.test|www\.|127\.0\.0\.1/);
  const info=await stat(output);
  assert.equal(info.mode&0o777,0o600);
  const data=JSON.parse(await readFile(output,'utf8'));
  assert.equal(data.capture.observations.length,2);
  assert.equal(data.migrationInput.siteDomain,'example.test');
  // Exclusive create: never overwrite earlier private evidence.
  const again=await runCli([
   '--manifest',source,'--out',output,'--port',String(port),
   '--enable-loopback-probe'
  ]);
  assert.equal(again.status,1);
  assert.equal(again.stdout,'');
  assert.equal(again.stderr,
   'SEO F138: private loopback staging capture refused or failed\n');
 }finally{await rm(dir,{recursive:true,force:true});await stop(server);}
});
test('F138 CLI refuses symlinked source without any network request',async()=>{
 const {server,port,seen}=await serveLocal();
 const dir=await mkdtemp(join(tmpdir(),'seo-f138-test-'));
 try{
  const source=join(dir,'manifest.json'),link=join(dir,'link.json');
  await writeFile(source,JSON.stringify(manifest()));
  await symlink(source,link);
  const response=await runCli([
    '--manifest',link,'--out',join(dir,'private-output.json'),
    '--port',String(port),'--enable-loopback-probe'
  ]);
  assert.equal(response.status,1);
  assert.equal(response.stdout,'');
  assert.equal(seen.length,0);
 }finally{await rm(dir,{recursive:true,force:true});await stop(server);}
});
