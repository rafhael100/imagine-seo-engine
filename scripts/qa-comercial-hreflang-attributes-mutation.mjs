/**
 * F102 — runner-local HTML mutation proving the auditor rejects an ambiguous
 * duplicate href that the former last-value parser could silently accept.
 * Only modifies a generated disposable Astro file; restores it in finally.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {auditStaticSite} from '../src/audit-static.mjs';

const [arg,...extra]=process.argv.slice(2);
if(process.env.GITHUB_ACTIONS!=='true'||!arg||extra.length)
  throw Error('F102 negative QA: CI and one disposable dist path required');
const root=resolve(arg);
if(root.split(sep).slice(-3).join('/')!=='.qa/comercial-i18n/dist')
  throw Error('F102 negative QA: unauthorized dist root');

const file=join(root,'en','index.html');
const original=await readFile(file,'utf8');
const opts={siteUrl:'https://imaginecomunicacao.com.br/',strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],checkHreflang:true};
const before=await auditStaticSite(root,opts);
assert.deepEqual(before.summary,{pages:45,errors:0,warnings:0});

const matches=[...original.matchAll(/<link\b[^>]*\bhreflang="en"[^>]*>/gi)];
assert.equal(matches.length,1,'Pinned Astro head needs exactly one EN alternate');
const valid=matches[0][0];
assert.match(valid,/\bhref="https:\/\/imaginecomunicacao\.com\.br\/en\/"/);
const broken=valid.replace('href="','href="https://example.invalid/private" href="');
assert.notEqual(broken,valid);
try{
  await writeFile(file,original.replace(valid,broken));
  const result=await auditStaticSite(root,opts);
  assert.ok(result.errors.some(x=>x.type==='invalid_hreflang_attributes'),
    'A duplicate href with a spoofed first value must be rejected');
  assert.doesNotMatch(JSON.stringify(result.errors),/example\.invalid/);
  console.log('F102: duplicate href blocked on actual Astro output');
}finally{
  await writeFile(file,original);
}
const after=await auditStaticSite(root,opts);
assert.deepEqual(after.summary,{pages:45,errors:0,warnings:0});
console.log('F102: generated HTML restored and entire build re-audited clean');
