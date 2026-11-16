import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {reviewTwoCompiledSiteMigration as inspect} from '../src/compiled-build-route-migration-review.mjs';

const origin='https://imaginecomunicacao.com.br';
const sha1='a'.repeat(40),sha2='b'.repeat(40);
const cli=new URL('../scripts/review-two-astro-route-migration.mjs',import.meta.url).pathname;
const html=path=>'<!doctype html><html lang="pt-BR"><head>'+
 '<title>Imagine — conteúdo exclusivo de '+path+'</title>'+
 '<meta name="description" content="Exemplo de auditoria privada local e revisão técnica de estrutura, metadados, HTML e experiência para planejamento digital.">'+
 '<meta name="robots" content="index,follow">'+
 '<link rel="canonical" href="'+origin+path+'">'+
 '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
 '</head><body><h1>Serviço digital verificado '+path+'</h1></body></html>';
function build(dir,second){
 mkdirSync(dir,{recursive:true});
 writeFileSync(join(dir,'index.html'),html('/'));
 if(second){
  mkdirSync(join(dir,'example'),{recursive:true});
  writeFileSync(join(dir,'example/index.html'),html('/example/'));
 }
 const routes=['/',...(second?['/example/']:[])];
 writeFileSync(join(dir,'sitemap.xml'),
  '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
  routes.map(x=>'<url><loc>'+origin+x+'</loc></url>').join('')+'</urlset>');
 writeFileSync(join(dir,'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
}
test('F169 detects real compiled route loss with no redirect and no authority',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'seo-f169-'));
 const old=join(dir,'old'),now=join(dir,'new');
 try{
  build(old,true);build(now,false);
  const result=await inspect({beforeDirectory:old,afterDirectory:now,candidates:[]});
  assert.equal(result.beforePages,2);
  assert.equal(result.afterPages,1);
  assert.equal(result.removedRoutes,1);
  assert.equal(result.unmappedRemovedRoutes,1);
  assert.equal(result.structuralMigrationReviewRequired,true);
  assert.equal(result.releaseStatus,'HOLD_ROUTE_LOSS_OR_TECHNICAL_REVIEW');
  for(const flag of ['originalUrlsStatusVerified','editorialContentEquivalenceVerified',
   'publicationAuthorized','deploymentAuthorized','indexingAuthorized','networkPerformed'])
   assert.equal(result[flag],false);
  assert.doesNotMatch(JSON.stringify(result),/example\/|<html|PRIVATE/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('F169 a syntactically covered route still requires independent equivalence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'seo-f169-'));
 const old=join(dir,'old'),now=join(dir,'new');
 try{
  build(old,true);build(now,false);
  const result=await inspect({beforeDirectory:old,afterDirectory:now,
   candidates:[{from:'/example/',to:'/'}]});
  assert.equal(result.unmappedRemovedRoutes,0);
  assert.equal(result.reviewed301Candidates,1);
  assert.equal(result.structuralMigrationReviewRequired,true);
  assert.equal(result.liveRedirectsInstalled,0);
  await assert.rejects(()=>inspect({beforeDirectory:old,afterDirectory:now,
   candidates:[{from:'/example/',to:'/fake/'}]}),/SEO redirect review/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('F169 CLI rejects identical directories and never prints secret paths',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seo-f169-'));
 const old=join(dir,'PRIVATE-CLIENT-PATH'),now=join(dir,'current');
 const invoke=args=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 try{
  build(old,true);build(now,false);
  const loss=invoke([old,now,sha1,sha2]);
  assert.equal(loss.status,1,loss.stderr);
  assert.equal(JSON.parse(loss.stdout).removedRoutes,1);
  assert.doesNotMatch(loss.stdout,/PRIVATE-CLIENT-PATH|\/example\//);
  for(const args of [
   [old,old,sha1,sha2],[old,now,sha1,sha1],
   [old,now,'main',sha2],[old,join(dir,'MISSING-SECRET'),sha1,sha2]
  ]){
   const result=invoke(args);
   assert.equal(result.status,2);
   assert.doesNotMatch(result.stderr,/PRIVATE-CLIENT-PATH|MISSING-SECRET|\/tmp\//);
  }
  assert.equal(invoke([]).status,2);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
