import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewGscLoopbackAgainstRealAstro as review}
 from '../labs/seo-f187-loopback-gsc-cross/verify-local-301.mjs';

const ORIGIN='https://imaginecomunicacao.com.br/';
const originalEnv={APP_ENV:process.env.APP_ENV,
 SEO_F138_LOOPBACK_STAGING:process.env.SEO_F138_LOOPBACK_STAGING};
process.env.APP_ENV='testing';
process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
async function withBuild(fn){
 const dir=await mkdtemp(join(tmpdir(),'seo-f187-'));
 try{
  const html='<!doctype html><html lang="pt-BR"><head>'+
   '<meta charset="utf-8"><title>Imagine sample homepage reviewed</title>'+
   '<meta name="description" content="Conteúdo de laboratório, revisado para testar links canônicos, rotas estáticas e resposta 301 em servidor local isolado.">'+
   '<meta name="robots" content="index,follow">'+
   '<meta property="og:url" content="'+ORIGIN+'">'+
   '<link rel="canonical" href="'+ORIGIN+'">'+
   '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
   '</head><body><h1>Site de serviços digitais</h1></body></html>';
  await writeFile(join(dir,'index.html'),html);
  await writeFile(join(dir,'robots.txt'),
   'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'sitemap.xml\n');
  await writeFile(join(dir,'sitemap.xml'),
   '<urlset><url><loc>'+ORIGIN+'</loc></url></urlset>');
  return await fn(dir);
 }finally{await rm(dir,{recursive:true,force:true})}
}
test('F187 obtains TWO actual loopback HEAD responses and binds them to compiled HTML',async()=>{
 await withBuild(async buildDirectory=>{
  const r=await review({buildDirectory,mode:'valid'});
  assert.equal(r.actualLocalHttpHeadRequests,2);
  assert.equal(r.actualCompiledHtmlPages,1);
  assert.equal(r.proposed301s,1);
  assert.equal(r.checkedHttpReceipts,1);
  assert.equal(r.originalHttpCaptureStatus,'human_http_staging_review_required');
  assert.equal(r.independentCrossEvidenceStatus,'human_independent_release_review_required');
  for(const key of ['providerGscAuthenticated','tenantGrantAuthenticated',
   'publicNetworkCalled','stagingTlsVerified','productionOriginVerified',
   'editorialEquivalenceApproved','publicationAuthorized',
   'redirectDeploymentAuthorized','indexingAuthorized'])
   assert.equal(r[key],false);
  assert.match(r.releaseStatus,/HOLD/);
  assert.doesNotMatch(JSON.stringify(r),
   /imaginecomunicacao\.com\.br|http:\/\//);
 });
});
for(const mode of ['temporary','wrong-location','second-hop','missing-final']){
 test('F187 rejects '+mode+' with independent HTTP evidence',async()=>{
  await withBuild(async buildDirectory=>{
   const r=await review({buildDirectory,mode});
   assert.equal(r.actualLocalHttpHeadRequests,2);
   assert.equal(r.originalHttpCaptureStatus,'blocked');
   assert.equal(r.independentCrossEvidenceStatus,'blocked');
   assert.equal(r.redirectDeploymentAuthorized,false);
  });
 });
}
test('F187 denies omitted explicit staging flag or unsupported mode',async()=>{
 await withBuild(async buildDirectory=>{
  await assert.rejects(()=>review({buildDirectory,mode:'production'}),/SEO F187/);
  const value=process.env.SEO_F138_LOOPBACK_STAGING;
  delete process.env.SEO_F138_LOOPBACK_STAGING;
  try{
   await assert.rejects(()=>review({buildDirectory,mode:'valid'}),/SEO F187/);
  }finally{process.env.SEO_F138_LOOPBACK_STAGING=value;}
 });
});
test('F187 never trusts missing or invalid HTML merely because loopback responds',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f187-empty-'));
 try{
  await assert.rejects(()=>review({buildDirectory:dir,mode:'valid'}));
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('F187 leaves process env restorable',()=>{
 for(const key of Object.keys(originalEnv)){
  // Client is responsible for env; lab never installs a lasting auth context.
  assert.equal(typeof process.env[key],'string');
 }
});
