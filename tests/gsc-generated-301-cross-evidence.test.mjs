import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {reviewGeneratedGsc301CrossEvidence as review}
 from '../src/gsc-generated-301-cross-evidence.mjs';

const domain='example.test',origin='https://'+domain+'/';
const row=(url,clicks,impressions)=>({
 keys:[url],clicks,impressions,
 ctr:impressions?clicks/impressions:0,position:15
});
function gsc({hasMore=false,secret=false}={}){
 return {
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',canonicalOrigin:origin,
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],
  rows:[
   row('http://www.example.test/',2,100),
   row('https://example.test/',0,5),
   ...(secret?[row('https://example.test/?token=PRIVATE-SECRET',0,4)]:[])
  ],hasMore
 };
}
const receipt=()=>({
 fromUrl:'http://www.example.test/',status:301,
 location:origin,finalUrl:origin,
 finalStatus:200,redirectHops:1
});
const capture=observations=>({
 sourceType:'operator_supplied_http_head_captures_unverified',
 observations
});
function input(buildDirectory,rows=gsc(),observations=[receipt()]){
 return {gscPageInput:rows,targetRoutes:['/'],
  httpCapture:capture(observations),buildDirectory};
}
function html(){
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
  '<title>Imagine original independent commercial homepage</title>'+
  '<meta name="description" content="Independent editorial content for the example business and its services in the reviewed local test site.">'+
  '<meta name="robots" content="index,follow">'+
  '<meta property="og:url" content="'+origin+'">'+
  '<link rel="canonical" href="'+origin+'">'+
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
  '</head><body><h1>Independent commercial services</h1>'+
  '<p>Editorially reviewed services for a synthetic site.</p>'+
  '</body></html>';
}
async function build(run){
 const dir=await mkdtemp(join(tmpdir(),'seo-f186-'));
 try{
  await writeFile(join(dir,'index.html'),html());
  await writeFile(join(dir,'robots.txt'),
   'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
  await writeFile(join(dir,'sitemap.xml'),
   '<urlset><url><loc>'+origin+'</loc></url></urlset>');
  return await run(dir);
 }finally{await rm(dir,{recursive:true,force:true});}
}

test('F186 ties generated conservative GSC 301 to real local Astro HTML and HTTP receipt',async()=>{
 await build(async dir=>{
  const result=await review(input(dir));
  assert.equal(result.contractVersion,'seo-f186-gsc-generated-301-cross-evidence-v1');
  assert.equal(result.reviewStatus,'human_independent_release_review_required');
  assert.equal(result.independentEvidenceStatus,'human_independent_release_review_required');
  assert.equal(result.proposedRedirects,1);
  assert.equal(result.examinedGscPageRows,2);
  assert.equal(result.checkedHttpReceipts,1);
  assert.equal(result.missingHttpReceipts,0);
  assert.equal(result.missingAstroDestinations,0);
  assert.equal(result.unmatchedGscRows,0);
  for(const key of [
   'originalGscSourceAuthenticated','backendTenantGrantVerified',
   'trustedStagingHttpAuthenticated','legacyContentEquivalenceApproved',
   'redirectDeploymentAuthorized','publicationAuthorized',
   'customerDisplayAuthorized','networkPerformed'
  ])assert.equal(result[key],false,key);
  assert.match(result.releaseStatus,/HOLD/);
  assert.equal(Object.hasOwn(result,'privateManifest'),false);
  assert.ok(Object.isFrozen(result));
  assert.doesNotMatch(JSON.stringify(result),/example\.test|http:|https:|PRIVATE-/);
 });
});

test('F186 blocks when the candidate 301 has no independent HTTP staging receipt',async()=>{
 await build(async dir=>{
  const result=await review(input(dir,gsc(),[]));
  assert.equal(result.reviewStatus,'blocked');
  assert.equal(result.missingHttpReceipts,1);
  assert.equal(result.proposedRedirects,1);
  assert.equal(result.publicationAuthorized,false);
  assert.doesNotMatch(JSON.stringify(result),/example\.test/);
 });
});

test('F186 blocks an observed redirect with wrong status, wrong destination or extra hop',async()=>{
 await build(async dir=>{
  const bad={...receipt(),status:302,location:'https://OTHER.example.test/',
   redirectHops:2};
  const result=await review(input(dir,gsc(),[bad]));
  assert.equal(result.reviewStatus,'blocked');
  assert.equal(result.checkedHttpReceipts,1);
  assert.equal(result.redirectDeploymentAuthorized,false);
  assert.doesNotMatch(JSON.stringify(result),/OTHER|example\.test/);
 });
});

test('F186 refuses partial GSC pagination before examining HTTP/build and suppresses proposal counts',async()=>{
 const result=await review(input('/private/DOES-NOT-EXIST',gsc({hasMore:true}),null));
 assert.equal(result.reviewStatus,'HOLD_INCOMPLETE_GSC_PAGINATION');
 assert.equal(result.proposedRedirects,null);
 assert.equal(result.checkedHttpReceipts,null);
 assert.equal(result.examinedGscPageRows,null);
 assert.equal(result.paginationIncomplete,true);
 assert.equal(result.privateUrlVariantsWithheld,false);
 assert.equal(result.publicationAuthorized,false);
});

test('F186 withholds all counts on GSC PAGE URLs with private query parameters',async()=>{
 const result=await review(input('/private/DOES-NOT-EXIST',gsc({secret:true}),null));
 assert.equal(result.reviewStatus,'HOLD_PRIVATE_GSC_URL_VARIANTS');
 assert.equal(result.proposedRedirects,null);
 assert.equal(result.examinedGscPageRows,null);
 assert.equal(result.privateUrlVariantsWithheld,true);
 assert.doesNotMatch(JSON.stringify(result),/SECRET|example\.test|http:/);
});

test('F186 rejects unreviewed input fields and sanitizes local filesystem errors',async()=>{
 await assert.rejects(review({...input('/private/UNKNOWN'),publish:true}),/SEO F186/);
 await assert.rejects(review({...input('/private/UNKNOWN'),
  targetRoutes:['/','/']}),/F127/);
 await assert.rejects(review(input('/private/UNKNOWN')),
  /SEO F186: independent HTTP or compiled build review failed/);
});


const cli=new URL('../scripts/review-gsc-http-astro-preflight.mjs',import.meta.url).pathname;
const execCli=(args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:60000});

test('F186 private CLI rechecks real Astro + independent HTTP, emits sanitized HOLD only',async()=>{
 await build(async dist=>{
  const secretDir=await mkdtemp(join(tmpdir(),'seo-f186-private-'));
  try{
   const pagePath=join(secretDir,'page.json');
   const httpPath=join(secretDir,'http.json');
   await writeFile(pagePath,JSON.stringify(gsc()),{mode:0o600});
   await writeFile(httpPath,JSON.stringify(capture([receipt()])),{mode:0o600});
   const good=execCli([pagePath,httpPath,dist]);
   assert.equal(good.status,1,good.stderr);
   const report=JSON.parse(good.stdout);
   assert.equal(report.reviewStatus,'human_independent_release_review_required');
   assert.equal(report.actualStaticHtmlAudited,true);
   assert.equal(report.auditedBuildPages,1);
   assert.equal(report.privateManifestPersisted,false);
   assert.equal(report.proposedRedirects,1);
   assert.equal(report.publicationAuthorized,false);
   assert.equal(report.redirectDeploymentAuthorized,false);
   assert.doesNotMatch(good.stdout+good.stderr,
    /example\.test|PRIVATE|page\.json|http\.json|seo-f186-private/);
   await writeFile(httpPath,JSON.stringify(capture([])),{mode:0o600});
   const missing=execCli([pagePath,httpPath,dist]);
   assert.equal(missing.status,1,missing.stderr);
   assert.equal(JSON.parse(missing.stdout).reviewStatus,'blocked');
   assert.equal(JSON.parse(missing.stdout).missingHttpReceipts,1);
  }finally{await rm(secretDir,{recursive:true,force:true});}
 });
});

test('F186 private CLI never scans build or prints private GSC when PAGE export is partial/redacted',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f186-private-'));
 try{
  const p=join(dir,'page.json'),c=join(dir,'http.json');
  await writeFile(c,JSON.stringify(capture([receipt()])),{mode:0o600});
  for(const [page,status] of [
   [gsc({hasMore:true}),'HOLD_INCOMPLETE_GSC_PAGINATION'],
   [gsc({secret:true}),'HOLD_PRIVATE_GSC_URL_VARIANTS']
  ]){
   await writeFile(p,JSON.stringify(page),{mode:0o600});
   const response=execCli([p,c,'/PRIVATE-NONEXISTENT-BUILD']);
   assert.equal(response.status,1,response.stderr);
   const report=JSON.parse(response.stdout);
   assert.equal(report.reviewStatus,status);
   assert.equal(report.actualStaticHtmlAudited,false);
   assert.equal(report.proposalGenerated,false);
   assert.equal(report.networkPerformed,false);
   assert.doesNotMatch(response.stdout+response.stderr,
    /PRIVATE-|example\.test|token|http:|https:/);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('F186 private CLI rejects insecure input permissions and forged fields with redacted stderr',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f186-private-'));
 try{
  const p=join(dir,'page.json'),c=join(dir,'http.json');
  await writeFile(p,JSON.stringify(gsc()),{mode:0o600});
  await writeFile(c,JSON.stringify(capture([receipt()])),{mode:0o600});
  assert.equal(execCli([p,p,'/PRIVATE-BUILD']).status,2);
  const invalid=execCli([p,c,'/PRIVATE-BUILD']);
  assert.equal(invalid.status,2);
  assert.equal(invalid.stdout,'');
  assert.doesNotMatch(invalid.stderr,/PRIVATE-BUILD|example\.test|seo-f186-private/);
  await writeFile(p,JSON.stringify({...gsc(),authorized:true}),{mode:0o600});
  assert.equal(execCli([p,c,'/PRIVATE-BUILD']).status,2);
  await writeFile(p,JSON.stringify(gsc()),{mode:0o600});
  if(process.platform!=='win32'){
   await chmod(p,0o644);
   const exposed=execCli([p,c,'/PRIVATE-BUILD']);
   assert.equal(exposed.status,2);
   assert.equal(exposed.stdout,'');
   assert.doesNotMatch(exposed.stderr,/page\.json|PRIVATE|example\.test/);
  }
  assert.equal(execCli([]).status,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
