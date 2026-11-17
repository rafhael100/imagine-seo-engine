import test from 'node:test';
import assert from 'node:assert/strict';
import {prioritizeOfflineGscLegacyMigration as review}
 from '../src/gsc-legacy-migration-priority.mjs';

const row=(url,clicks,impressions)=>({
 keys:[url],clicks,impressions,ctr:impressions?clicks/impressions:0,position:17.2
});
const base=(rows,hasMore=false)=>({
 gscPageInput:{
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',
  canonicalOrigin:'https://example.test/',
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],rows,hasMore
 },
 legacyMigrationInput:{
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:'https://example.test/',
  legacyUrls:[
   'https://www.example.test/','http://www.example.test/',
   'https://www.example.test/en-us/'
  ],targetRoutes:['/','/en/'],
  candidates:[{fromUrl:'https://www.example.test/',toPath:'/',status:301}]
 }
});
test('F183 prioritizes real-shaped original GSC rows by impressions',()=>{
 const data=base([
  row('https://www.example.test/',5,1132),
  row('http://www.example.test/',3,134),
  row('https://www.example.test/en-us/',0,70),
  row('https://example.test/',0,1),
  row('https://www.example.test/old.html',2,500),
  row('https://blog.example.test/private-product/',0,25)
 ]);
 const out=review(data);
 assert.equal(out.sourceRows,6);
 assert.equal(out.redactedRows,0);
 assert.equal(out.buckets.mapped_legacy_review.impressions,1132);
 assert.equal(out.buckets.unmapped_legacy_review.impressions,204);
 assert.equal(out.buckets.unlisted_noncanonical_review.impressions,500);
 assert.equal(out.buckets.other_subdomain_scope_review.impressions,25);
 assert.equal(out.buckets.already_canonical.impressions,1);
 assert.equal(out.atRiskPageRows,4);
 assert.equal(out.atRiskClicks,5);
 assert.equal(out.atRiskImpressions,729);
 assert.deepEqual(out.prioritizedReviewIndices.map(x=>x.sourceRowIndex),[4,1,2,5]);
 assert.equal(out.prioritizedReviewIndices[0].reasonCode,'unlisted_noncanonical_review');
 assert.equal(out.omittedPriorityCount,0);
 for(const key of ['providerOAuthVerified','portalTenantGrantVerified',
  'liveRedirectHttpVerified','deploymentAuthorized','publicationAuthorized',
  'indexingAuthorized','networkPerformed'])
  assert.equal(out[key],false,key);
 const rendered=JSON.stringify(out);
 assert.doesNotMatch(rendered,/example\.test|old\.html|en-us|private-product|https:\/\//);
});
test('F183 withholds ALL counts and priorities on one private URL variant',()=>{
 const data=base([
  row('https://www.example.test/',2,80),
  row('https://example.test/?token=PRIVATE',1,10)
 ]);
 const out=review(data);
 assert.equal(out.metricsWithheld,true);
 assert.equal(out.atRiskClicks,null);
 assert.equal(out.atRiskImpressions,null);
 assert.equal(out.prioritizedReviewIndices,null);
 assert.equal(out.buckets,null);
 assert.doesNotMatch(JSON.stringify(out),/PRIVATE|www\.example\.test/);
});
test('F183 discloses incomplete pagination, never says all URLs covered',()=>{
 const out=review(base([row('https://www.example.test/',1,4)],true));
 assert.equal(out.paginationIncomplete,true);
 assert.equal(out.completeSearchConsoleCoverageVerified,false);
 assert.equal(out.atRiskPageRows,0);
 assert.equal(out.publicationAuthorized,false);
});
test('F183 rejects malformed rows, forged authorizations and domain drift',()=>{
 const a=base([row('https://www.example.test/',2,80)]);
 a.gscPageInput.rows[0].permission='granted';
 assert.throws(()=>review(a),/F131/);
 const b=base([row('https://www.example.test/',2,80)]);
 b.gscPageInput.property='sc-domain:other.test';
 assert.throws(()=>review(b),/F131|F133/);
 const c=base([row('https://www.example.test/',2,80)]);
 c.deployAuthorized=true;
 assert.throws(()=>review(c),/F133/);
 const d=base([row('https://www.example.test/',2,80)]);
 d.legacyMigrationInput.candidates[0].status=302;
 assert.throws(()=>review(d),/F127/);
});
test('F183 caps priority output and retains aggregated totals',()=>{
 const rows=Array.from({length:80},(_,i)=>
  row('https://www.example.test/legacy-'+i+'/',0,80-i));
 const out=review(base(rows));
 assert.equal(out.atRiskPageRows,80);
 assert.equal(out.prioritizedReviewIndices.length,25);
 assert.equal(out.omittedPriorityCount,55);
 assert.equal(out.prioritizedReviewIndices[0].sourceRowIndex,0);
 assert.equal(out.prioritizedReviewIndices[24].sourceRowIndex,24);
});
test('F183 rejects unsafe metric accumulation overflow',()=>{
 const a=base([
  row('https://www.example.test/a/',0,Number.MAX_SAFE_INTEGER),
  row('https://www.example.test/b/',0,10)
 ]);
 assert.throws(()=>review(a),/F183: unsafe aggregated metrics/);
});

test('F183 private CLI returns HOLD and emits no original URL or file path',async()=>{
 const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');
 const {join}=await import('node:path');
 const {tmpdir}=await import('node:os');
 const {spawnSync}=await import('node:child_process');
 const temp=mkdtempSync(join(tmpdir(),'seo-f183-'));
 const old=join(temp,'SECRET-GSC.json'),plan=join(temp,'SECRET-301.json');
 const exec=()=>spawnSync(process.execPath,[
  new URL('../scripts/review-gsc-redirect-priority-offline.mjs',import.meta.url).pathname,
  old,plan
 ],{encoding:'utf8'});
 try{
  const sample=base([row('http://www.example.test/',3,134)]);
  writeFileSync(old,JSON.stringify(sample.gscPageInput),{mode:0o600});
  writeFileSync(plan,JSON.stringify(sample.legacyMigrationInput),{mode:0o600});
  const report=exec();
  assert.equal(report.status,1,report.stderr);
  assert.equal(JSON.parse(report.stdout).atRiskImpressions,134);
  assert.doesNotMatch(report.stdout,/example\.test|SECRET-GSC|SECRET-301/);
  assert.doesNotMatch(report.stderr,/example\.test|SECRET-GSC|SECRET-301/);
  const {chmodSync}=await import('node:fs');
  chmodSync(old,0o644);
  const refused=exec();
  assert.equal(refused.status,2);
  assert.doesNotMatch(refused.stderr,/SECRET-GSC|SECRET-301/);
 }finally{rmSync(temp,{recursive:true,force:true})}
});
