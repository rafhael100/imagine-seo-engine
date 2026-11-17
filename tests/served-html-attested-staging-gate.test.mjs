import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,readFile,stat,rm,chmod,symlink,access} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runServedHtmlAttestedStagingQa} from
  '../labs/seo-f143-full-served-gate/run-served-html-staging-gate.mjs';
import {fingerprintCompiledSite} from '../src/compiled-site-fingerprint.mjs';

const cli=fileURLToPath(new URL(
  '../scripts/run-served-html-staging-qa.mjs',import.meta.url
));
const ORIGIN='https://example.test/';
function manifest(){
 return {
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:ORIGIN,
  legacyUrls:['http://www.example.test/'],
  targetRoutes:['/'],
  candidates:[{fromUrl:'http://www.example.test/',toPath:'/',status:301}]
 };
}
function gsc(){
 return {
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',canonicalOrigin:ORIGIN,
  startDate:'2026-10-17',endDate:'2026-11-13',dataState:'final',
  dimensions:['page'],rows:[
   {keys:['http://www.example.test/'],clicks:1,impressions:20,ctr:0.05,position:22},
   {keys:[ORIGIN],clicks:1,impressions:10,ctr:0.1,position:9}
  ],hasMore:false
 };
}
function html(){
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
  '<title>Original service content for region</title>'+
  '<meta name="description" content="Original service from Imagine communications">'+
  '<meta name="robots" content="index,follow">'+
  '<meta property="og:url" content="'+ORIGIN+'">'+
  '<link rel="canonical" href="'+ORIGIN+'">'+
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
  '</head><body><h1>Regional business services</h1>'+
  '<p>Original text about the services and their benefits.</p></body></html>';
}
async function fixture(fn,{redirectStatus=301,missingHtml=false,staleDigest=false,staleServedHtml=false,httpRobots=null}={}){
 const dir=await mkdtemp(join(tmpdir(),'seo-f139-'));
 const build=join(dir,'compiled-html');
 await mkdir(build);
 if(!missingHtml)
  await writeFile(join(build,'index.html'),html());
 await writeFile(join(build,'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'sitemap.xml\n');
 await writeFile(join(build,'sitemap.xml'),
  '<urlset><url><loc>'+ORIGIN+'</loc></url></urlset>');
 const gscPath=join(dir,'gsc-private.json');
 const planPath=join(dir,'migration-private.json');
 const out=join(dir,'receipts-private.json');
 await writeFile(gscPath,JSON.stringify(gsc()),{mode:0o600});
 await writeFile(planPath,JSON.stringify(manifest()),{mode:0o600});
 const buildDigest=missingHtml?'f'.repeat(64):
  (await fingerprintCompiledSite(build)).sha256;
 const seen=[];
 const server=http.createServer((req,res)=>{
  seen.push({host:req.headers.host,proto:req.headers['x-forwarded-proto']});
  if(req.headers.host==='www.example.test'){
   res.writeHead(redirectStatus,{Location:ORIGIN});res.end();
  }else if(req.headers.host==='example.test'){
   res.writeHead(200,{
    'X-Imagine-SEO-Build-SHA256':staleDigest?'0'.repeat(64):buildDigest,
    'Content-Type':'text/html; charset=utf-8',
    ...(httpRobots===null?{}:{'X-Robots-Tag':httpRobots})
   });
   res.end(req.method==='GET'?
    (staleServedHtml?html().replace('Original','Other___'):html()):'');
  }else{res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>
   server.once('error',reject).listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 try{
  return await fn({dir,build,gscPath,planPath,out,port,seen});
 }finally{
  await new Promise(resolve=>server.close(resolve));
  await rm(dir,{recursive:true,force:true});
 }
}
async function envLab(fn){
 const oldA=process.env.APP_ENV,oldB=process.env.SEO_F138_LOOPBACK_STAGING;
 process.env.APP_ENV='testing';
 process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
 try{return await fn();}
 finally{
  if(oldA===undefined)delete process.env.APP_ENV;
  else process.env.APP_ENV=oldA;
  if(oldB===undefined)delete process.env.SEO_F138_LOOPBACK_STAGING;
  else process.env.SEO_F138_LOOPBACK_STAGING=oldB;
 }
}
async function cliRun(a){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[cli,
    '--gsc',a.gscPath,'--manifest',a.planPath,
    '--build',a.build,'--out',a.out,'--port',String(a.port),
    '--enable-loopback-probe'
  ],{
    env:{...process.env,APP_ENV:'testing',
      SEO_F138_LOOPBACK_STAGING:'YES_I_CONTROL_THIS_LOOPBACK'},
    cwd:process.cwd(),stdio:['ignore','pipe','pipe']
  });
  let stdout='',stderr='';
  child.stdout.on('data',b=>stdout+=b.toString());
  child.stderr.on('data',b=>stderr+=b.toString());
  child.once('error',reject);
  child.once('close',status=>resolve({status,stdout,stderr}));
 });
}
test('F143 performs real local HTTP only after GSC and HTML preflight success',async()=>{
 await fixture(async args=>envLab(async()=>{
  const result=await runServedHtmlAttestedStagingQa({
   gscPageInput:gsc(),migrationInput:manifest(),
   buildDirectory:args.build,stagingPort:args.port,timeoutMs:2000
  });
  assert.equal(result.report.reviewStatus,'human_independent_served_html_staging_review_required');
  assert.equal(result.report.summary.validHttp301Receipts,1);
  assert.equal(result.report.summary.auditedLocalHtmlPages,1);
  assert.equal(result.report.networkPerformed,true);
  assert.equal(result.report.loopbackOnlyConnectionUsed,true);
  assert.equal(result.report.buildDigestMatchedInLocalProxy,true);
  assert.equal(result.report.buildStableDuringQa,true);
  assert.equal(result.report.publicTlsIdentityVerified,false);
  assert.equal(result.report.productionReleaseAuthorized,false);
  assert.equal(args.seen.length,4);
  assert.equal(result.report.summary.servedGetRoutesChecked,1);
  assert.equal(result.report.summary.identicalServedHtmlRoutes,1);
  assert.equal(result.report.buildStableDuringGetAudit,true);
  assert.deepEqual(args.seen.map(x=>x.host),['example.test','www.example.test','example.test','example.test']);
  assert.doesNotMatch(JSON.stringify(result.report),/example\.test|http:\/\//);
 }));
});
test('F143 prevents all HTTP probes if original GSC contains private data',async()=>{
 await fixture(async args=>envLab(async()=>{
  const privateGsc=gsc();
  privateGsc.rows.push({
   keys:['https://example.test/?token=secret'],clicks:0,
   impressions:2,ctr:0,position:11
  });
  const result=await runServedHtmlAttestedStagingQa({
   gscPageInput:privateGsc,migrationInput:manifest(),
   buildDirectory:args.build,stagingPort:args.port,timeoutMs:2000
  });
  assert.equal(result.report.reviewStatus,'blocked');
  assert.equal(result.report.networkPerformed,false);
  assert.equal(result.capture,null);
  assert.deepEqual(result.report.blockedComponents,
   ['gsc_historical_migration_coverage']);
  assert.equal(args.seen.length,0);
  assert.doesNotMatch(JSON.stringify(result.report),/token=secret/);
 }));
});
test('F143 prevents HTTP when compiled HTML does not include planned target',async()=>{
 await fixture(async args=>envLab(async()=>{
  const result=await runServedHtmlAttestedStagingQa({
   gscPageInput:gsc(),migrationInput:manifest(),
   buildDirectory:args.build,stagingPort:args.port,timeoutMs:2000
  });
  assert.equal(result.report.reviewStatus,'blocked');
  assert.deepEqual(result.report.blockedComponents,
    ['compiled_html_redirect_destinations']);
  assert.equal(result.report.networkPerformed,false);
  assert.equal(args.seen.length,0);
 }),{missingHtml:true});
});
test('F143 CLI executes full QA and stores private receipts without leaking source',async()=>{
 await fixture(async args=>{
  const r=await cliRun(args);
  assert.equal(r.status,0,r.stderr);
  assert.equal(r.stderr,'');
  const view=JSON.parse(r.stdout);
  assert.equal(view.summary.validHttp301Receipts,1);
  assert.equal(view.productionReleaseAuthorized,false);
  for(const secret of ['example.test','http://','https://',args.gscPath,args.planPath])
   assert.equal(r.stdout.includes(secret),false,secret);
  const info=await stat(args.out);
  assert.equal(info.mode&0o777,0o600);
  const privateOutput=JSON.parse(await readFile(args.out,'utf8'));
  assert.equal(privateOutput.capture.observations.length,1);
  const again=await cliRun(args);
  assert.equal(again.status,1);
  assert.equal(again.stdout,'');
 },{redirectStatus:301});
});
test('F143 CLI exit 2 with real local HTTP 302; no raw URL in stdout',async()=>{
 await fixture(async args=>{
  const r=await cliRun(args);
  assert.equal(r.status,2,r.stderr);
  assert.equal(r.stderr,'');
  const report=JSON.parse(r.stdout);
  assert.equal(report.reviewStatus,'blocked');
  assert.deepEqual(report.blockedComponents,['http_redirect_receipt_evidence']);
  assert.equal(report.summary.httpReceiptWrongStatus,1);
  assert.doesNotMatch(r.stdout,/www\.example|https:\/\//);
 },{redirectStatus:302});
});

test('F143 blocks a stale local proxy build header before any redirect HEADs',async()=>{
 await fixture(async args=>envLab(async()=>{
  const result=await runServedHtmlAttestedStagingQa({
   gscPageInput:gsc(),migrationInput:manifest(),
   buildDirectory:args.build,stagingPort:args.port,timeoutMs:2000
  });
  assert.equal(result.report.reviewStatus,'blocked');
  assert.deepEqual(result.report.blockedComponents,
   ['loopback_build_identity_mismatch']);
  assert.equal(result.report.networkPerformed,true);
  assert.equal(result.capture,null);
  assert.equal(args.seen.length,1);
  assert.deepEqual(args.seen.map(x=>x.host),['example.test']);
  assert.doesNotMatch(JSON.stringify(result.report),/example\.test|https:\/\/\//);
 }),{staleDigest:true});
});

test('F143 blocks stale HTML body even when proxy announces correct SHA',async()=>{
 await fixture(async args=>envLab(async()=>{
  const result=await runServedHtmlAttestedStagingQa({
   gscPageInput:gsc(),migrationInput:manifest(),
   buildDirectory:args.build,stagingPort:args.port,timeoutMs:2000
  });
  assert.equal(result.report.reviewStatus,'blocked');
  assert.deepEqual(result.report.blockedComponents,
    ['served_html_bytes_differ_from_audited_build']);
  assert.equal(result.report.summary.servedGetRoutesChecked,1);
  assert.equal(result.report.summary.identicalServedHtmlRoutes,0);
  assert.equal(result.report.summary.alteredServedHtmlRoutes,1);
  assert.equal(result.report.buildDigestMatchedInLocalProxy,true);
  assert.equal(result.report.productionReleaseAuthorized,false);
  assert.equal(args.seen.length,4);
  assert.doesNotMatch(JSON.stringify(result.report),/example\\.test|Other___/);
 }),{staleServedHtml:true});
});

test('F207 full staging gate identifies HTTP robots restriction despite identical build bytes',async()=>{
 await fixture(async args=>envLab(async()=>{
  const result=await runServedHtmlAttestedStagingQa({
   gscPageInput:gsc(),migrationInput:manifest(),
   buildDirectory:args.build,stagingPort:args.port,timeoutMs:2000
  });
  assert.equal(result.report.reviewStatus,'blocked');
  assert.deepEqual(result.report.blockedComponents,
    ['served_html_http_robots_policy_blocked']);
  assert.equal(result.report.buildDigestMatchedInLocalProxy,true);
  assert.equal(result.report.buildStableDuringGetAudit,true);
  assert.equal(result.report.summary.servedGetRoutesChecked,1);
  assert.equal(result.report.summary.identicalServedHtmlRoutes,1);
  assert.equal(result.report.summary.alteredServedHtmlRoutes,0);
  assert.equal(result.report.productionReleaseAuthorized,false);
  assert.equal(args.seen.length,4);
  assert.doesNotMatch(JSON.stringify(result.report),/example\.test|googlebot|noindex/);
 }),{httpRobots:'googlebot: noindex'});
});


test('F199 denies world-readable GSC or redirect source BEFORE any local HEAD',async()=>{
 await fixture(async a=>{
  await chmod(a.gscPath,0o644);
  const badGsc=await cliRun(a);
  assert.equal(badGsc.status,1);
  assert.equal(badGsc.stdout,'');
  assert.equal(a.seen.length,0);
  assert.doesNotMatch(badGsc.stderr,/example\.test|gsc-private|\/tmp\//);
  await chmod(a.gscPath,0o600);
  await chmod(a.planPath,0o644);
  const badManifest=await cliRun(a);
  assert.equal(badManifest.status,1);
  assert.equal(badManifest.stdout,'');
  assert.equal(a.seen.length,0);
 });
});
test('F199 denies 0755 parent folder before any private evidence is loaded',async()=>{
 await fixture(async a=>{
  await chmod(a.dir,0o755);
  const result=await cliRun(a);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(a.seen.length,0);
  await chmod(a.dir,0o700);
 });
});
test('F199 refuses HTTP receipt output in ANY Git worktree, even private 0700',async()=>{
 await fixture(async a=>{
  const work=join(a.dir,'foreign-private-git');
  const safe=join(work,'operator');
  await mkdir(join(work,'.git'),{recursive:true,mode:0o700});
  await mkdir(safe,{mode:0o700});
  a.out=join(safe,'hidden-receipts.json');
  const result=await cliRun(a);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(a.seen.length,0);
  await assert.rejects(access(a.out));
 });
});
test('F199 refuses GSC source inside a Git worktree even with 0600 permissions',async()=>{
 await fixture(async a=>{
  const work=join(a.dir,'foreign-gsc-repository');
  const safe=join(work,'private');
  await mkdir(join(work,'.git'),{recursive:true,mode:0o700});
  await mkdir(safe,{mode:0o700});
  a.gscPath=join(safe,'gsc.json');
  await writeFile(a.gscPath,JSON.stringify(gsc()),{mode:0o600});
  const result=await cliRun(a);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(a.seen.length,0);
 });
});
test('F199 rejects symbolic operator directory aliases and never creates receipts',async()=>{
 await fixture(async a=>{
  const alias=join(a.dir,'symlinked-private');
  await symlink(a.dir,alias);
  a.out=join(alias,'receipts.json');
  const result=await cliRun(a);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(a.seen.length,0);
  await assert.rejects(access(join(a.dir,'receipts.json')));
 });
});
