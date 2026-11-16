import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewOfflineMigrationCrossEvidence as review} from
  '../src/migration-cross-evidence-release-gate.mjs';

const domain='example.test',origin='https://'+domain+'/';
function plan(){
 return {
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:domain,canonicalOrigin:origin,
  legacyUrls:['http://www.example.test/','https://www.example.test/en-us/'],
  targetRoutes:['/','/en/'],
  candidates:[
   {fromUrl:'http://www.example.test/',toPath:'/',status:301},
   {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
 };
}
const row=(url,clicks,impressions)=>({
 keys:[url],clicks,impressions,ctr:impressions?clicks/impressions:0,position:15
});
function gsc(){
 return {
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',canonicalOrigin:origin,
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],
  rows:[
   row('http://www.example.test/',2,100),
   row('https://www.example.test/en-us/',1,10),
   row('https://example.test/',0,5)
  ],hasMore:false
 };
}
function receipt(fromUrl,target){
 return {fromUrl,status:301,location:target,finalUrl:target,
   finalStatus:200,redirectHops:1};
}
function capture(){
 return {
   sourceType:'operator_supplied_http_head_captures_unverified',
   observations:[
    receipt('http://www.example.test/','https://example.test/'),
    receipt('https://www.example.test/en-us/','https://example.test/en/')
   ]
 };
}
function html(route,lang,body){
 const url=new URL(route,origin).href;
 return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8">'+
 '<title>Original regional editorial '+route+'</title>'+
 '<meta name="description" content="Professional original business content '+route+'">'+
 '<meta name="robots" content="index,follow">'+
 '<meta property="og:url" content="'+url+'">'+
 '<link rel="canonical" href="'+url+'">'+
 '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
 '</head><body><h1>Original regional services</h1>'+body+'</body></html>';
}
async function withBuild(run,{missingEn=false}={}){
 const dir=await mkdtemp(join(tmpdir(),'seo-f136-'));
 try{
  await writeFile(join(dir,'index.html'),html('/','pt-BR',
   missingEn?'Home editorial':'<a href="/en/">International services</a>'));
  if(!missingEn){
   await mkdir(join(dir,'en'),{recursive:true});
   await writeFile(join(dir,'en','index.html'),
    html('/en/','en','<p>Independent English content</p>'));
  }
  await writeFile(join(dir,'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
  await writeFile(join(dir,'sitemap.xml'),'<urlset>'+
    (missingEn?['/']:['/','/en/']).map(path=>
      '<url><loc>'+new URL(path,origin).href+'</loc></url>').join('')+
    '</urlset>');
  await run({
    gscPageInput:gsc(),migrationInput:plan(),httpCapture:capture(),
    buildDirectory:dir
  });
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('F136 combines three independent valid inputs, remains human HOLD',async()=>{
 await withBuild(async input=>{
  const result=await review(input);
  assert.equal(result.reviewStatus,'human_independent_release_review_required');
  assert.deepEqual(result.blockedComponents,[]);
  assert.equal(result.summary.observedLegacyGscRowsUnmapped,0);
  assert.equal(result.summary.validHttp301Receipts,2);
  assert.equal(result.summary.auditedLocalHtmlPages,2);
  assert.equal(result.summary.missingBuildDestinations,0);
  assert.equal(result.compiledHtmlActuallyAudited,true);
  for(const flag of [
   'authenticatedGoogleDataVerified','httpCaptureOriginVerified',
   'actualRedirectsVerifiedInTrustedStaging',
   'sourceTenantAndKeyVerified','editorialEquivalenceApproved',
   'realProductionReleaseAuthorized','customerDisplayAuthorized',
   'networkPerformed'
  ])assert.equal(result[flag],false,flag);
  assert.doesNotMatch(JSON.stringify(result),/example.test|http:\/\//);
 });
});
test('F136 blocks absent actual HTTP receipt independently of GSC and HTML',async()=>{
 await withBuild(async input=>{
  input.httpCapture.observations.pop();
  const result=await review(input);
  assert.deepEqual(result.blockedComponents,['http_redirect_receipt_evidence']);
  assert.equal(result.summary.missingHttpReceipts,1);
  assert.equal(result.summary.missingBuildDestinations,0);
 });
});
test('F136 blocks old GSC URL omitted in otherwise correct 301 plan',async()=>{
 await withBuild(async input=>{
  input.gscPageInput.rows.push(row('https://www.example.test/legacy/',0,12));
  const result=await review(input);
  assert.deepEqual(result.blockedComponents,['gsc_historical_migration_coverage']);
  assert.equal(result.summary.observedLegacyGscRowsUnmapped,1);
  assert.equal(result.summary.validHttp301Receipts,2);
 });
});
test('F136 blocks missing target route in actual built HTML',async()=>{
 await withBuild(async input=>{
  const result=await review(input);
  assert.deepEqual(result.blockedComponents,['compiled_html_redirect_destinations']);
  assert.equal(result.summary.missingBuildDestinations,1);
 },{missingEn:true});
});
test('F136 private URLs suppress GSC metrics and deny release',async()=>{
 await withBuild(async input=>{
  input.gscPageInput.rows.push(row('https://example.test/?token=secret',0,5));
  const result=await review(input);
  assert.equal(result.reviewStatus,'blocked');
  assert.equal(result.summary.observedLegacyGscRowsUnmapped,null);
  assert.equal(result.summary.gscRowsRedacted,1);
  assert.doesNotMatch(JSON.stringify(result),/token=secret|example.test/);
 });
});
test('F136 rejects authorizing fields or unsupported manifest schema',async()=>{
 await withBuild(async input=>{
  await assert.rejects(review({...input,deploy:true}),/SEO F136/);
  await assert.rejects(review({...input,migrationInput:{
    ...input.migrationInput,approvedByAdmin:true
  }}),/SEO F127/);
 });
});
