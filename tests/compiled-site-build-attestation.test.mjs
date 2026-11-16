import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fingerprintCompiledSite} from '../src/compiled-site-fingerprint.mjs';
import {attestLocalStagingBuild} from
  '../labs/seo-f140-build-attestation/verify-loopback-build.mjs';

const fingerprintCli=fileURLToPath(new URL(
 '../scripts/fingerprint-compiled-site-offline.mjs',import.meta.url
));
const verifyCli=fileURLToPath(new URL(
 '../scripts/verify-staging-build-fingerprint.mjs',import.meta.url
));
const manifest=()=>({
 sourceType:'operator_supplied_legacy_urls_unverified',
 siteDomain:'example.test',canonicalOrigin:'https://example.test/',
 legacyUrls:['http://www.example.test/'],
 targetRoutes:['/'],
 candidates:[{fromUrl:'http://www.example.test/',toPath:'/',status:301}]
});
async function build(run){
 const root=await mkdtemp(join(tmpdir(),'seo-f140-'));
 const dist=join(root,'dist');
 await mkdir(dist);
 await writeFile(join(dist,'index.html'),
  '<html><head><title>Original Test Content</title></head><body>Private test fixture</body></html>');
 await writeFile(join(dist,'robots.txt'),'User-agent: *\nAllow: /');
 await writeFile(join(dist,'sitemap.xml'),
  '<urlset><url><loc>https://example.test/</loc></url></urlset>');
 const manifestPath=join(root,'private-legacy-manifest.json');
 await writeFile(manifestPath,JSON.stringify(manifest()),{mode:0o600});
 try{return await run({root,dist,manifestPath});}
 finally{await rm(root,{force:true,recursive:true});}
}
async function host(header,{status=200}={}){
 const seen=[];
 const server=http.createServer((req,res)=>{
  seen.push({host:req.headers.host,path:req.url,method:req.method});
  res.writeHead(status,header===null?{}:{
   'X-Imagine-SEO-Build-SHA256':header
  });res.end();
 });
 await new Promise((ok,fail)=>
  server.once('error',fail).listen(0,'127.0.0.1',ok));
 return {port:server.address().port,server,seen};
}
const stop=server=>new Promise(ok=>server.close(ok));
async function staging(fn){
 const old={APP_ENV:process.env.APP_ENV,
   SEO_F138_LOOPBACK_STAGING:process.env.SEO_F138_LOOPBACK_STAGING};
 process.env.APP_ENV='testing';
 process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
 try{return await fn();}
 finally{
  for(const [k,v] of Object.entries(old)){
   if(v===undefined)delete process.env[k];
   else process.env[k]=v;
  }
 }
}
function child(command,args,env={}){
 return new Promise((resolve,reject)=>{
  const p=spawn(process.execPath,[command,...args],{
   env:{...process.env,...env},cwd:process.cwd(),
   stdio:['ignore','pipe','pipe']
  });
  let stdout='',stderr='';
  p.stdout.on('data',d=>stdout+=d.toString());
  p.stderr.on('data',d=>stderr+=d.toString());
  p.once('error',reject);
  p.once('close',status=>resolve({status,stdout,stderr}));
 });
}
test('F140 fingerprints the same content deterministically, independently of root path',async()=>{
 await build(async a=>build(async b=>{
  const first=await fingerprintCompiledSite(a.dist);
  const second=await fingerprintCompiledSite(b.dist);
  assert.match(first.sha256,/^[a-f0-9]{64}$/);
  assert.equal(first.sha256,second.sha256);
  assert.equal(first.filesHashed,3);
  assert.equal(first.htmlFilesHashed,1);
  assert.equal(first.networkPerformed,false);
  await writeFile(join(b.dist,'index.html'),
   '<html><body>Edited content</body></html>');
  const altered=await fingerprintCompiledSite(b.dist);
  assert.notEqual(first.sha256,altered.sha256);
 }));
});
test('F140 refuses symlinks and empty builds before making any network call',async()=>{
 await build(async({root,dist})=>{
  const file=join(root,'private-target');
  await writeFile(file,'secret');
  await symlink(file,join(dist,'private-alias'));
  await assert.rejects(fingerprintCompiledSite(dist),/SEO F140/);
  await rm(join(dist,'private-alias'));
  const alias=join(root,'dist-link');
  await symlink(dist,alias);
  await assert.rejects(fingerprintCompiledSite(alias),/SEO F140/);
  const blank=join(root,'empty');
  await mkdir(blank);
  await assert.rejects(fingerprintCompiledSite(blank),/SEO F140/);
 });
});
test('F140 matches a real local reverse-proxy HEAD build digest but never authenticates TLS',async()=>{
 await build(async({dist})=>{
  const digest=(await fingerprintCompiledSite(dist)).sha256;
  const server=await host(digest);
  try{
   const output=await staging(()=>attestLocalStagingBuild({
    migrationInput:manifest(),buildDirectory:dist,
    stagingPort:server.port,timeoutMs:2000
   }));
   assert.equal(output.reviewStatus,'human_independent_build_identity_review_required');
   assert.equal(output.summary.localBuildDigestMatched,true);
   assert.equal(output.loopbackOnlyConnectionUsed,true);
   assert.equal(output.tlsCertificateAuthenticated,false);
   assert.equal(output.proxyIdentityAuthenticated,false);
   assert.equal(output.publicationAuthorized,false);
   assert.deepEqual(server.seen,[{
    host:'example.test',path:'/',method:'HEAD'
   }]);
   assert.doesNotMatch(JSON.stringify(output),/example\.test|https:\/\//);
  }finally{await stop(server.server);}
 });
});
test('F140 blocks stale build header and missing header',async()=>{
 await build(async({dist})=>{
  for(const head of ['f'.repeat(64),null]){
   const server=await host(head);
   try{
    const output=await staging(()=>attestLocalStagingBuild({
     migrationInput:manifest(),buildDirectory:dist,
     stagingPort:server.port,timeoutMs:2000
    }));
    assert.equal(output.reviewStatus,'blocked');
    assert.equal(output.summary.localBuildDigestMatched,false);
    assert.equal(output.publicationAuthorized,false);
   }finally{await stop(server.server);}
  }
 });
});
test('F140 requires explicit opt-in and rejects unsupported ports',async()=>{
 await build(async({dist})=>{
  await assert.rejects(attestLocalStagingBuild({
   migrationInput:manifest(),buildDirectory:dist,
   stagingPort:18290,timeoutMs:2000
  }),/SEO F140/);
  await staging(async()=>{
   await assert.rejects(attestLocalStagingBuild({
    migrationInput:manifest(),buildDirectory:dist,
    stagingPort:80,timeoutMs:2000
   }),/SEO F140/);
  });
 });
});
test('F140 private operator CLI produces only redacted attestation result',async()=>{
 await build(async({dist,manifestPath})=>{
  const expected=(await fingerprintCompiledSite(dist)).sha256;
  const server=await host(expected);
  try{
   const digest=await child(fingerprintCli,[dist]);
   assert.equal(digest.status,0,digest.stderr);
   assert.equal(JSON.parse(digest.stdout).sha256,expected);
   const verify=await child(verifyCli,[
    '--manifest',manifestPath,'--build',dist,
    '--port',String(server.port),'--enable-loopback-probe'
   ],{
    APP_ENV:'testing',SEO_F138_LOOPBACK_STAGING:'YES_I_CONTROL_THIS_LOOPBACK'
   });
   assert.equal(verify.status,0,verify.stderr);
   assert.equal(JSON.parse(verify.stdout).summary.localBuildDigestMatched,true);
   assert.doesNotMatch(verify.stdout,/example\.test|https:\/\//);
   assert.equal(verify.stderr,'');
  }finally{await stop(server.server);}
 });
});
