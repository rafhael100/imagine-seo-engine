/**
 * F101: prove that a real, immutable Comercial Astro build fails closed after
 * a synthetic corruption of hreflang clusters. GitHub Actions only.
 * Modifies ONLY generated temporary dist HTML and restores in finally.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {auditStaticSite} from '../src/audit-static.mjs';

const [input,...extra]=process.argv.slice(2);
if(process.env.GITHUB_ACTIONS!=='true'||!input||extra.length)
  throw Error('F101 mutation QA: GitHub Actions and one dist directory required');
const root=resolve(input);
if(root.split(sep).slice(-3).join('/')!=='.qa/comercial-i18n/dist')
  throw Error('F101 mutation QA: only reviewed disposable Comercial dist is allowed');

const originalPage=join(root,'index.html');
const spanishPage=join(root,'es','index.html');
const [ptHtml,esHtml]=await Promise.all([
  readFile(originalPage,'utf8'),readFile(spanishPage,'utf8')
]);
const config={
  siteUrl:'https://imaginecomunicacao.com.br/',
  strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
};
function dropAlternate(html,code){
  const rx=new RegExp('<link\\b(?=[^>]*\\brel="alternate")(?=[^>]*\\bhreflang="'+code+'")[^>]*>','gi');
  const found=[...html.matchAll(rx)];
  assert.equal(found.length,1,'F101 mutation requires exactly one locale alternate');
  return html.replace(rx,'');
}
try{
  const before=await auditStaticSite(root,config);
  assert.deepEqual(before.summary,{pages:45,errors:0,warnings:0},
    'Pinned Comercial build must start with zero SEO findings');
  // PT<->EN and EN<->ES remain reciprocal, but PT and ES no longer
  // announce each other. F100 alone misses this disconnected cluster.
  await writeFile(originalPage,dropAlternate(ptHtml,'es'));
  await writeFile(spanishPage,dropAlternate(esHtml,'pt-BR'));
  const broken=await auditStaticSite(root,config);
  assert.ok(broken.errors.some(x=>x.type==='hreflang_cluster_inconsistent'),
    'F101 must detect a split cluster even with correct bilateral returns');
  assert.equal(broken.errors.some(x=>x.type==='hreflang_missing_return'),false,
    'Mutation must specifically exercise full-cluster consistency, not F100');
  console.log('F101: synthetic split-cluster rejection verified on 45 built pages');
}finally{
  await Promise.all([
    writeFile(originalPage,ptHtml),
    writeFile(spanishPage,esHtml)
  ]);
}
const restored=await auditStaticSite(root,config);
assert.deepEqual(restored.summary,{pages:45,errors:0,warnings:0},
  'Disposable build must be restored after negative test');
console.log('F101: pristine Astro build restored and re-audited');
