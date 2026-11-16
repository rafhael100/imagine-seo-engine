import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewOfflineGscLegacyMigrationCoverage as review} from
  '../src/gsc-legacy-redirect-coverage.mjs';

const row=(url,clicks,impressions)=>({
  keys:[url],clicks,impressions,ctr:impressions?clicks/impressions:0,
  position:18.4
});
const migration=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',
  canonicalOrigin:'https://example.test/',
  legacyUrls:[
    'https://www.example.test/',
    'http://www.example.test/',
    'https://www.example.test/en-us/'
  ],
  targetRoutes:['/','/en/'],
  candidates:[
    {fromUrl:'https://www.example.test/',toPath:'/',status:301},
    {fromUrl:'http://www.example.test/',toPath:'/',status:301},
    {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
});
const gsc=(rows,hasMore=false)=>({
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',
  canonicalOrigin:'https://example.test/',
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],rows,hasMore
});
const input=(rows,hasMore=false)=>({
  gscPageInput:gsc(rows,hasMore),legacyMigrationInput:migration()
});
test('F133 all GSC observed legacy URLs are mapped in F127 (human review only)',()=>{
 const result=review(input([
   row('https://www.example.test/',5,1132),
   row('http://www.example.test/',3,134),
   row('https://example.test/',0,1),
   row('https://www.example.test/en-us/',1,25)
 ]));
 assert.equal(result.reviewStatus,'human_independent_redirect_review_required');
 assert.equal(result.summary.coveredLegacyGscPageRows,3);
 assert.equal(result.summary.alreadyCanonicalGscPageRows,1);
 assert.equal(result.summary.uncoveredLegacyGscPageRows,0);
 assert.equal(result.summary.otherSubdomainGscPageRows,0);
 assert.deepEqual(result.uncoveredGscIndices,[]);
 assert.deepEqual(result.reviewSignals,[]);
 for(const flag of ['propertyAuthenticated','originalGoogleSearchDataVerified',
   'existingLiveHttp301Verified','allLegacyUrlsDiscovered',
   'redirectEquivalenceEditoriallyApproved','redirectDeploymentAuthorized',
   'customerDisplayAuthorized','networkPerformed'])
  assert.equal(result[flag],false,flag);
 const output=JSON.stringify(result);
 for(const hidden of ['www.example.test','example.test','/en-us/',
   'https://','http://'])assert.ok(!output.includes(hidden),hidden);
});
test('F133 blocks actual GSC legacy page when operator omitted its mapping',()=>{
 const payload=input([
  row('https://www.example.test/',5,1132),
  row('http://www.example.test/',3,134)
 ]);
 payload.legacyMigrationInput.legacyUrls.pop();
 payload.legacyMigrationInput.candidates.pop();
 payload.legacyMigrationInput.legacyUrls.shift();
 payload.legacyMigrationInput.candidates.shift();
 const result=review(payload);
 assert.equal(result.reviewStatus,'blocked');
 assert.equal(result.summary.uncoveredLegacyGscPageRows,1);
 assert.deepEqual(result.uncoveredGscIndices,[0]);
 assert.ok(result.reviewSignals.includes(
   'review_observed_legacy_urls_without_redirect_mapping'));
});
test('F133 blocks unscoped subdomains, paginated GSC data and invalid F127 mapping',()=>{
 const sub=review(input([
  row('https://blog.example.test/post/',0,3),
  row('https://example.test/',1,12)
 ]));
 assert.equal(sub.reviewStatus,'blocked');
 assert.equal(sub.summary.otherSubdomainGscPageRows,1);
 assert.ok(sub.reviewSignals.includes('review_unscoped_gsc_subdomain_origins'));
 const incomplete=review(input([row('https://example.test/',1,12)],true));
 assert.equal(incomplete.reviewStatus,'blocked');
 assert.ok(incomplete.reviewSignals.includes('review_remaining_gsc_page_pagination'));
 const unsafe=input([row('https://example.test/',1,12)]);
 unsafe.legacyMigrationInput.candidates[0].status=302;
 assert.throws(()=>review(unsafe),/SEO F127/);
});
test('F133 holds all metrics if any GSC URL contains private query data',()=>{
 const result=review(input([
   row('https://example.test/?token=private',0,6),
   row('https://www.example.test/',1,14)
 ]));
 assert.equal(result.reviewStatus,'blocked');
 assert.equal(result.summary.redactedGscPageRows,1);
 assert.equal(result.summary.coveredLegacyGscPageRows,null);
 assert.deepEqual(result.uncoveredGscIndices,[]);
 assert.deepEqual(result.reviewSignals,
   ['withhold_all_coverage_due_to_private_url_variants']);
 assert.doesNotMatch(JSON.stringify(result),/token=private|example\\.test/);
});
test('F133 rejects different domain, wrong origin, extra permission, getter',()=>{
 const wrong=input([row('https://example.test/',0,5)]);
 wrong.gscPageInput.property='sc-domain:other.test';
 assert.throws(()=>review(wrong),/SEO F131|SEO F133/);
 const other=input([row('https://example.test/',0,5)]);
 other.gscPageInput.canonicalOrigin='https://www.example.test/';
 assert.throws(()=>review(other),/SEO F133/);
 const privilege={...input([row('https://example.test/',0,5)]),
  authorizeDeployment:true};
 assert.throws(()=>review(privilege),/SEO F133/);
 const getter=input([row('https://example.test/',0,5)]);
 Object.defineProperty(getter.gscPageInput.rows[0],'keys',
   {enumerable:true,get(){throw Error('PRIVATE')}});
 assert.throws(()=>review(getter),/SEO F131/);
});
