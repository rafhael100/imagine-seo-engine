import test from 'node:test';
import assert from 'node:assert/strict';
import {planOfflineGscQueryPage} from '../src/gsc-query-page-planner.mjs';
import {prepareOfflinePortalQueryPageReview as prepare}
  from '../src/portal-query-page-review.mjs';

const base={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:3,startRow:0};
const row=(q,p,clicks)=>({keys:[q,'https://example.com/'+p],
  clicks,impressions:100,ctr:clicks/100,position:8});
const fixture=()=>({
  sourceRevision:'a'.repeat(40),
  plan:planOfflineGscQueryPage(base),
  pages:[{startRow:0,rows:[
    row('PRIVATE-TERM-F74','page-a',5),
    row('PRIVATE-TERM-F74','page-b',4)
  ],responseAggregationType:'byPage'}]
});

test('F74 derives a sanitized, non-displayable Portal handoff',()=>{
  const output=prepare(fixture());
  assert.equal(output.contractVersion,'seo-portal-query-page-review-offline-v1');
  assert.equal(output.scope.tenantRef,'imagine-demo');
  assert.equal(output.summary.queriesOnMultiplePages,1);
  assert.equal(output.summary.distinctQueries,1);
  assert.equal(output.summary.receivedRows,2);
  assert.equal(output.coverageStatus,'SUPPLIED_BATCH_ONLY_UNVERIFIED');
  assert.deepEqual(output.suggestedReviews,['review_query_page_overlap']);
  assert.equal(output.oauthVerified,false);
  assert.equal(output.customerDisplayAuthorized,false);
  assert.equal(output.publicationAuthorized,false);
  assert.equal(output.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  assert.doesNotMatch(JSON.stringify(output),
    /PRIVATE-TERM-F74|https:\/\/example\.com|page-a|page-b/);
});
test('F74 suppresses review suggestions if last provider page may be incomplete',()=>{
  const input=fixture();
  input.plan=planOfflineGscQueryPage({...base,rowLimit:2});
  const output=prepare(input);
  assert.equal(output.coverageStatus,'PARTIAL_BATCH_NO_SIGNALS');
  assert.deepEqual(output.suggestedReviews,[]);
  assert.equal(output.pagination.mayHaveMore,true);
});
test('F74 suppresses suggestions when a personal query has been redacted',()=>{
  const input=fixture();
  input.pages[0].rows[1].keys[0]='123.456.789-09';
  const output=prepare(input);
  assert.equal(output.summary.redactedRows,1);
  assert.equal(output.coverageStatus,'REDACTED_ROWS_NO_SIGNALS');
  assert.deepEqual(output.suggestedReviews,[]);
  assert.doesNotMatch(JSON.stringify(output),/123\.456\.789/);
});
test('F74 refuses forged permissions, invalid revision and altered page plan',()=>{
  const a=fixture();
  for(const evidence of [
    {...a,sourceRevision:'main'},
    {...a,sourceRevision:'A'.repeat(40)},
    {...a,customerDisplayAuthorized:true},
    {...a,plan:{...a.plan,oauthVerified:true}},
    {...a,pages:[{...a.pages[0],startRow:99}]},
    {...a,summary:{receivedRows:3}}
  ])assert.throws(()=>prepare(evidence));
});
