/**
 * SEO F115: prove the F113 private-draft detector on the unchanged,
 * pinned Imagine Comercial Astro build. CI workspace only.
 *
 * Each mutation is restored in finally; no source, deployment, CDN,
 * public site, OAuth, customer data or provider API is touched.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {auditStaticSite} from '../src/audit-static.mjs';

const [arg,...extra]=process.argv.slice(2);
if(process.env.GITHUB_ACTIONS!=='true'||!arg||extra.length)
  throw Error('F115: disposable Actions build path required');
const root=resolve(arg);
if(root.split(sep).slice(-3).join('/')!=='.qa/comercial-i18n/dist')
  throw Error('F115: unauthorized build directory');

const file=join(root,'en','index.html');
const original=await readFile(file,'utf8');
const opts={
  siteUrl:'https://imaginecomunicacao.com.br/',
  strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
};
const clean=async()=>{
  const report=await auditStaticSite(root,opts);
  assert.deepEqual(report.summary,{pages:45,errors:0,warnings:0});
};
await clean();
assert.ok(original.includes('<head>')||/<head\s[^>]*>/i.test(original),
  'Pinned Astro source must have a real head');
assert.match(original,/<\/body>/i,'Pinned Astro source must have a real body');
try{
  const marker='<meta name="imagine:editorial-preview" '+
    'content="private-unpublished-review">';
  const changed=original.replace(/<head(\s[^>]*)?>/i,match=>match+marker);
  assert.notEqual(changed,original,'F115 HEAD marker mutation not applied');
  await writeFile(file,changed);
  let found=await auditStaticSite(root,opts);
  assert.equal(found.errors.filter(e=>e.type===
    'private_editorial_preview_in_public_build'&&e.file==='en/index.html').length,1,
    'F113 must reject private marker even on indexable Astro page');
  assert.equal(found.errors.some(e=>e.type==='unexpected_noindex'),false,
    'Mutation deliberately preserves robots=index; marker must cause rejection');
  console.log('F115: real Astro indexable HTML with private marker blocked');

  const legacy='RASCUNHO INTERNO — NÃO PUBLICAR NEM INDEXAR';
  const legacyHtml=original.replace(/<\/body>/i,'<div>'+legacy+'</div></body>');
  assert.notEqual(legacyHtml,original,'F115 legacy mutation not applied');
  await writeFile(file,legacyHtml);
  found=await auditStaticSite(root,opts);
  assert.equal(found.errors.filter(e=>e.type===
    'private_editorial_preview_in_public_build'&&e.file==='en/index.html').length,1,
    'F113 must also reject legacy private editorial warning');
  console.log('F115: legacy private draft warning blocked in real Astro output');
}finally{
  await writeFile(file,original);
}
await clean();
console.log('F115: fixed 45-page Astro output restored; complete strict SEO audit clean');
