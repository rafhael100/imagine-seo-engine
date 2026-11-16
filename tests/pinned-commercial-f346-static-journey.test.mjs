import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewPinnedCommercialF346Build as review,PINNED_COMERCIAL_F346_SHA}
 from '../src/pinned-commercial-f346-static-journey.mjs';
const labels=[
 ['index.html','Simular investimento em site e anúncios'],
 ['en/index.html','Estimate website and ads costs'],
 ['es/index.html','Estimar costos de sitio y anuncios']
];
function html(action,{quoteHref='#simular-compra',hidden=true,duplicate=false}={}){
 return '<!doctype html><html lang="pt-BR"><head><title>Imagine synthetic F346 compiled preview</title></head><body>'+
 '<section data-growth-calculator data-growth-locale="pt-BR">'+
 '<a href="'+quoteHref+'" data-growth-quote>'+action+'</a></section>'+
 '<section id="simular-compra" data-choice-preview data-locale="pt-BR">'+
 '<strong data-choice-onetime>3 × R$ 330,00</strong>'+
 '<button type="button" data-choice-copy'+(hidden?' hidden':'')+'>Copy estimate</button>'+
 (duplicate?'<button data-choice-copy hidden>duplicate</button>':'')+
 '</section><main>Review synthetic independently compiled Astro customer experience. This is a static fixture only.</main>'+
 '</body></html>';
}
async function fixture(run,options={}){
 const dir=await mkdtemp(join(tmpdir(),'seo-f187-'));
 try{
  for(const [relative,label] of labels){
   const path=join(dir,relative);
   if(relative.includes('/'))await mkdir(join(dir,'en'),{recursive:true});
   if(relative.includes('/'))await mkdir(join(dir,'es'),{recursive:true});
   await writeFile(path,html(label,options),'utf8');
  }
  return await run(dir);
 }finally{await rm(dir,{force:true,recursive:true})}
}
test('F187 validates three actual compiled HTML locale files without disclosing host or customer data',async()=>{
 await fixture(async dir=>{
  const r=await review(dir,PINNED_COMERCIAL_F346_SHA);
  assert.equal(r.auditedCompiledLocales,3);
  assert.equal(r.sourceRevision,PINNED_COMERCIAL_F346_SHA);
  assert.equal(r.copyProgressivelyEnhanced,true);
  assert.equal(r.matchingCanonicalQuoteTarget,true);
  assert.equal(r.customerDataCaptured,false);
  assert.equal(r.actualRedirectsInstalled,0);
  assert.equal(r.publicationAuthorized,false);
  assert.equal(r.tenantAuthorized,false);
  assert.ok(Object.isFrozen(r));
  assert.doesNotMatch(JSON.stringify(r),/\/tmp\/|http:|https:|PRIVATE-SECRET/);
 });
});
test('F187 rejects missing, duplicated, nonlocal or hidden-without-JS clipboard links',async()=>{
 for(const settings of [
  {quoteHref:'https://example.invalid/buy'},
  {quoteHref:'#unreviewed'},
  {hidden:false},
  {duplicate:true}
 ]){
  await fixture(async dir=>assert.rejects(
   review(dir,PINNED_COMERCIAL_F346_SHA),/SEO F187/),settings);
 }
 await fixture(async dir=>{
  await rm(join(dir,'es'),{recursive:true,force:true});
  await assert.rejects(review(dir,PINNED_COMERCIAL_F346_SHA),/SEO F187/);
  await assert.rejects(review(dir,'deadbeef'),/SEO F187/);
 });
});
