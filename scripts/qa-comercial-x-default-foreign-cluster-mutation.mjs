/**
 * SEO-F103: negative mutation of x-default in the three real Astro homepages.
 * All three locales are deliberately changed in the same way, so F101's
 * normal inter-language group check stays satisfied. Only F103 can detect
 * that x-default now targets a DIFFERENT declared translation group.
 * This script runs solely on a disposable Actions checkout and restores it.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {auditStaticSite} from '../src/audit-static.mjs';

const [arg,...extra]=process.argv.slice(2);
if(process.env.GITHUB_ACTIONS!=='true'||!arg||extra.length)
  throw Error('F103 x-default mutation QA: Actions with one dist path required');
const root=resolve(arg);
if(root.split(sep).slice(-3).join('/')!=='.qa/comercial-i18n/dist')
  throw Error('F103 x-default mutation QA: disposable Comercial dist required');

const paths=['index.html','en/index.html','es/index.html'];
const files=paths.map(p=>join(root,p));
const originals=await Promise.all(files.map(p=>readFile(p,'utf8')));
const config={siteUrl:'https://imaginecomunicacao.com.br/',strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],checkHreflang:true};
const before=await auditStaticSite(root,config);
assert.deepEqual(before.summary,{pages:45,errors:0,warnings:0});

function mutateXDefault(html){
  const tags=[...html.matchAll(/<link\b[^>]*\bhreflang="x-default"[^>]*>/gi)];
  assert.equal(tags.length,1,'Each home requires one x-default alternate');
  const tag=tags[0][0];
  const oldHref='href="https://imaginecomunicacao.com.br/"';
  assert.ok(tag.includes(oldHref),'Expected pinned public default homepage');
  const damaged=tag.replace(oldHref,
    'href="https://imaginecomunicacao.com.br/servicos/"');
  assert.notEqual(damaged,tag);
  return html.replace(tag,damaged);
}
try{
  for(let i=0;i<files.length;i++)
    await writeFile(files[i],mutateXDefault(originals[i]));
  const report=await auditStaticSite(root,config);
  assert.ok(report.errors.some(x=>x.type==='hreflang_x_default_foreign_cluster'),
    'x-default to a different localized service cluster must be rejected');
  assert.equal(report.errors.some(x=>x.type==='hreflang_cluster_inconsistent'),false,
    'Attack preserves group parity; rejection must be from F103');
  assert.equal(report.errors.some(x=>x.type==='hreflang_missing_return'),false,
    'Attack must not disturb reciprocal locale links');
  console.log('F103: foreign x-default group rejected despite consistent PT/EN/ES alternates');
}finally{
  await Promise.all(files.map((p,i)=>writeFile(p,originals[i])));
}
const restored=await auditStaticSite(root,config);
assert.deepEqual(restored.summary,{pages:45,errors:0,warnings:0});
console.log('F103: all three Astro homepage HTML files restored, SEO audit clean');
