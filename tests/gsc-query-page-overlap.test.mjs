import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineGscQueryPageOverlap as review} from '../src/gsc-query-page-overlap.mjs';
const property='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl:property,
  propertyFingerprint:createHash('sha256').update(property).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:10};
const row=(query,url,clicks=2,impressions=20)=>({
  keys:[query,'https://www.example.com'+url],
  clicks,impressions,ctr:clicks/impressions,position:9
});
test('F57 returns only anonymous overlap counts and no query/page paths',()=>{
  const result=review({responseAggregationType:'byPage',rows:[
    row('criação de sites','/a',5,50),
    row('criação de sites','/b',4,40),
    row('pessoa@example.com','/secret',3,30),
    row('landing pages','/a',2,20),
    row('landing pages','/b',1,10)
  ]},scope);
  assert.equal(result.summary.receivedRows,5);
  assert.equal(result.summary.redactedRows,1);
  assert.equal(result.summary.analyzedRows,4);
  assert.equal(result.summary.distinctQueries,2);
  assert.equal(result.summary.queriesOnMultiplePages,2);
  assert.equal(result.summary.totalPagesAcrossOverlappingQueries,4);
  assert.equal(result.summary.impressionsOnOverlappingQueries,120);
  assert.equal(result.reviewStatus,'POSSIBLE_QUERY_PAGE_OVERLAP_REVIEW');
  assert.equal(result.productionReadAuthorized,false);
  assert.equal(result.networkPerformed,false);
  assert.doesNotMatch(JSON.stringify(result),/pessoa@example\.com|criação de sites|landing pages|\/a|\/b/);
});
test('F57 recognizes full domain property but rejects external/subdomain spoofing',()=>{
  for(const page of [
    'https://example.com.evil.test/a',
    'https://evil.test/a',
    'http://example.com/a',
    'https://x@example.com/a',
    'https://example.com/a?token=private',
    'https://example.com/a#secret'
  ]){
    const bad={...row('site','/a'),keys:['site',page]};
    assert.throws(()=>review({rows:[bad]},scope),/invalid query\/page row/);
  }
  const ok=review({rows:[{
    ...row('seo','/a'),keys:['seo','https://example.com/a']
  }]},scope);
  assert.equal(ok.summary.distinctQueries,1);
});
test('F57 rejects forged authorization, extra fields, incomplete metadata',()=>{
  for(const payload of [
    {rows:[row('seo','/a')],oauthVerified:true},
    {rows:[{...row('seo','/a'),tenantGrantVerified:true}]},
    {rows:[row('seo','/a')],responseAggregationType:'byProperty'},
    {rows:[row('seo','/a')],metadata:{first_incomplete_date:null}},
    {rows:[row('seo','/a')],metadata:{first_incomplete_hour:false}},
    {rows:[row('seo','/a')],metadata:{another:'field'}}
  ])assert.throws(()=>review(payload,scope));
});
test('F57 rejects duplicates and metric tampering',()=>{
  for(const rows of [
    [row('site','/a'),row('site','/a')],
    [row('site','/a',2),row('sites','/b',3)],
    [{...row('site','/a'),ctr:.9}],
    [{...row('site','/a'),clicks:21}],
    [{...row('site','/a'),position:0}],
    [{...row('site','/a'),impressions:-1}]
  ])assert.throws(()=>review({rows},scope));
});
test('F57 requires matching property fingerprint and capped row limit',()=>{
  for(const cfg of [
    {...scope,tenantRef:'bad tenant'},
    {...scope,propertyFingerprint:'a'.repeat(64)},
    {...scope,siteUrl:'sc-domain:another.example'},
    {...scope,endDate:'2026-02-29'},
    {...scope,rowLimit:0},
    {...scope,oauthVerified:true}
  ])assert.throws(()=>review({rows:[]},cfg));
});
test('F57 full page has possible truncation and never asserts definitive absence of overlap',()=>{
  const output=review({rows:[row('seo','/a')]},{...scope,rowLimit:1});
  assert.equal(output.summary.possibleTruncation,true);
  assert.equal(output.reviewStatus,'PARTIAL_COVERAGE_REVIEW_ONLY');
});
test('F57 no overlap in supplied pages is not proof of site-wide uniqueness',()=>{
  const output=review({rows:[row('seo','/a'),row('sites','/b')]},scope);
  assert.equal(output.summary.queriesOnMultiplePages,0);
  assert.equal(output.reviewStatus,'NO_OVERLAP_IN_SUPPLIED_ROWS');
  assert.equal(output.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
});
