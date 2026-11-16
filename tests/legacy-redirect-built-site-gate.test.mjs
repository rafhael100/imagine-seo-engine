import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewCompiledLegacyRedirectTargets as review}
  from '../src/legacy-redirect-built-site-gate.mjs';
const domain='example.test',origin='https://'+domain+'/';
const plan=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:domain,canonicalOrigin:origin,
  legacyUrls:['http://www.example.test/','https://www.example.test/en-us/'],
  targetRoutes:['/','/en/'],
  candidates:[
    {fromUrl:'http://www.example.test/',toPath:'/',status:301},
    {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
});
function html(route,lang,body,extra=''){
 const url=new URL(route,origin).href;
 return '<!doctype html><html lang="'+lang+'"><head>'+
 '<meta charset="utf-8"><title>Original regional editorial '+route+'</title>'+
 '<meta name="description" content="Professional original business content '+route+'">'+
 '<meta name="robots" content="index,follow">'+
 '<meta property="og:url" content="'+url+'">'+
 '<link rel="canonical" href="'+url+'">'+extra+
 '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
 '</head><body><h1>Original regional services</h1>'+body+'</body></html>';
}
async function withBuild(run,{missingEnglish=false,badSitemap=false,preview=false}={}){
 const dir=await mkdtemp(join(tmpdir(),'seo-f128-'));
 try{
  await writeFile(join(dir,'index.html'),
    html('/','pt-BR',missingEnglish?'Home editorial':
      '<a href="/en/">International service</a>'));
  if(!missingEnglish){
    await mkdir(join(dir,'en'),{recursive:true});
    await writeFile(join(dir,'en','index.html'),html('/en/','en',
      '<p>Original English regional content.</p>',preview?
        '<meta name="imagine:editorial-preview" content="private-unpublished-review">':''));
  }
  await writeFile(join(dir,'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
  const indexed=badSitemap?['/']:missingEnglish?['/']:['/','/en/'];
  await writeFile(join(dir,'sitemap.xml'),'<urlset>'+
    indexed.map(p=>'<url><loc>'+new URL(p,origin).href+'</loc></url>').join('')+
    '</urlset>');
  await run({planInput:plan(),buildDirectory:dir});
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('F128 verifies actual new HTML for all redirect destinations, remains HOLD',async()=>{
 await withBuild(async input=>{
   const out=await review(input);
   assert.equal(out.reviewStatus,'human_independent_redirect_review_required');
   assert.equal(out.summary.declaredTargetRoutes,2);
   assert.equal(out.summary.auditedRealBuildPages,2);
   assert.equal(out.summary.missingTargetRoutes,0);
   assert.equal(out.summary.staticHtmlErrors,0);
   assert.equal(out.summary.pagesNotInSitemap,0);
   assert.equal(out.summary.aliasReviewCount,1);
   assert.equal(out.htmlActuallyAudited,true);
   assert.equal(out.productionRedirectsApplied,0);
   for(const flag of [
    'originalSiteHttpStatusesVerified','legacyContentEquivalenceVerified',
    'realSearchConsoleImported','publicationAuthorized',
    'redirectDeploymentAuthorized','customerDisplayAuthorized','networkPerformed'
   ])assert.equal(out[flag],false,flag);
   assert.doesNotMatch(JSON.stringify(out),/example\.test|www\.|en-us|\/en\//);
 });
});
test('F128 blocks redirect destination that is listed but absent from build',async()=>{
 await withBuild(async input=>{
   const out=await review(input);
   assert.equal(out.reviewStatus,'blocked');
   assert.equal(out.summary.missingTargetRoutes,1);
   assert.deepEqual(out.missingRouteIndices,[1]);
   assert.equal(out.redirectDeploymentAuthorized,false);
 },{missingEnglish:true});
});
test('F128 blocks audited HTML with private editorial marker',async()=>{
 await withBuild(async input=>{
   const out=await review(input);
   assert.equal(out.reviewStatus,'blocked');
   assert.equal(out.summary.staticHtmlErrors>0,true);
   assert.equal(out.publicationAuthorized,false);
 },{preview:true});
});
test('F128 blocks built page omitted from sitemap even if HTML otherwise valid',async()=>{
 await withBuild(async input=>{
   const out=await review(input);
   assert.equal(out.reviewStatus,'blocked');
   assert.equal(out.summary.pagesNotInSitemap,1);
 },{badSitemap:true});
});
test('F128 blocks unsafe caller fields or host mismatch',async()=>{
 await withBuild(async input=>{
   await assert.rejects(review({...input,publishNow:true}),/SEO F128/);
   await assert.rejects(review({...input,planInput:{
     ...input.planInput,canonicalOrigin:'https://www.example.test/'
   }}),/SEO F127/);
   await assert.rejects(review({...input,planInput:{
     ...input.planInput,candidates:[...input.planInput.candidates,
       {fromUrl:'https://evil.test/',toPath:'/',status:301}]
   }}),/SEO F127/);
 });
});
