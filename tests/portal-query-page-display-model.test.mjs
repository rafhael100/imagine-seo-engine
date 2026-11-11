import test from 'node:test';
import assert from 'node:assert/strict';
import {planOfflineGscQueryPage} from '../src/gsc-query-page-planner.mjs';
import {prepareOfflinePortalQueryPageDisplayModel as display}
  from '../src/portal-query-page-display-model.mjs';

const base={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:3,startRow:0};
const row=(term,page,clicks)=>({
  keys:[term,'https://example.com/'+page],
  clicks,impressions:100,ctr:clicks/100,position:8
});
const fixture=()=>({
  sourceRevision:'f'.repeat(40),
  plan:planOfflineGscQueryPage(base),
  pages:[{startRow:0,rows:[
    row('PRIVATE-F79-TERM','page-a',6),
    row('PRIVATE-F79-TERM','page-b',5)
  ],responseAggregationType:'byPage'}]
});
function assertNoAuthority(result){
  for(const field of [
    'oauthVerified','propertyAuthorizationVerified','backendTenantGrantVerified',
    'customerDisplayAuthorized','publicationAuthorized','networkPerformed'
  ])assert.equal(result[field],false,field+' must remain false');
  assert.equal(result.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  assert.equal(result.reviewStatus,'REQUIRES_AUTHENTICATED_HUMAN_REVIEW');
  assert.doesNotMatch(JSON.stringify(result),
    /PRIVATE-F79-TERM|https:\/\/example\.com|page-a|page-b|session=PRIVATE-F79/i);
}

test('F79 derives non-customer display DTO from original F74 data',()=>{
  const out=display(fixture());
  assert.equal(out.contractVersion,'seo-portal-query-page-display-offline-v1');
  assert.equal(out.coverageStatus,'SUPPLIED_BATCH_ONLY_UNVERIFIED');
  assert.equal(out.metricsWithheld,false);
  assert.equal(out.metricsWithheldReason,null);
  assert.deepEqual(out.suggestedReviews,['review_query_page_overlap']);
  assert.deepEqual(out.summary,{
    receivedRows:2,redactedRows:0,analyzedRows:2,
    distinctQueries:1,queriesOnMultiplePages:1,pagesAcrossOverlappingQueries:2
  });
  assertNoAuthority(out);
  assert.deepEqual(out,display(fixture()));
});
test('F79 hides all query metrics for a partial batch',()=>{
  const input=fixture();
  input.plan=planOfflineGscQueryPage({...base,rowLimit:2});
  const out=display(input);
  assert.equal(out.coverageStatus,'PARTIAL_BATCH_NO_SIGNALS');
  assert.equal(out.metricsWithheld,true);
  assert.equal(out.metricsWithheldReason,'POSSIBLE_INCOMPLETE_PAGINATION');
  assert.deepEqual(out.suggestedReviews,[]);
  assert.equal(out.summary.receivedRows,2);
  assert.equal(out.summary.redactedRows,0);
  for(const key of ['analyzedRows','distinctQueries',
    'queriesOnMultiplePages','pagesAcrossOverlappingQueries'])
    assert.equal(out.summary[key],null);
  assertNoAuthority(out);
});
test('F79 hides all query metrics for a redacted private query',()=>{
  const input=fixture();
  input.pages[0].rows[1].keys[0]='123.456.789-09';
  const out=display(input);
  assert.equal(out.coverageStatus,'REDACTED_ROWS_NO_SIGNALS');
  assert.equal(out.metricsWithheld,true);
  assert.equal(out.metricsWithheldReason,'PRIVACY_REDACTION');
  assert.equal(out.summary.redactedRows,1);
  assert.equal(out.summary.receivedRows,2);
  assert.deepEqual(out.suggestedReviews,[]);
  for(const key of ['analyzedRows','distinctQueries',
    'queriesOnMultiplePages','pagesAcrossOverlappingQueries'])
    assert.equal(out.summary[key],null);
  assert.doesNotMatch(JSON.stringify(out),/123\.456\.789-09/);
  assertNoAuthority(out);
});
test('F79 preserves verified arithmetic across two supplied pages without grants',()=>{
  const input=fixture();
  input.plan=planOfflineGscQueryPage({...base,rowLimit:2});
  input.pages=[
    {startRow:0,responseAggregationType:'byPage',rows:[
      row('PRIVATE-F79-TERM','page-a',6),
      row('ANOTHER-F79-TERM','page-b',5)
    ]},
    {startRow:2,responseAggregationType:'byPage',
      rows:[row('PRIVATE-F79-TERM','page-c',4)]}
  ];
  const out=display(input);
  assert.equal(out.summary.receivedRows,3);
  assert.equal(out.summary.distinctQueries,2);
  assert.equal(out.summary.queriesOnMultiplePages,1);
  assert.equal(out.summary.pagesAcrossOverlappingQueries,2);
  assert.equal(out.pagination.pagesReceived,2);
  assert.equal(out.pagination.mayHaveMore,false);
  assertNoAuthority(out);
});
test('F79 refuses caller-provided reports, forged grants and malformed evidence',()=>{
  const good=fixture();
  for(const input of [
    {report:display(good)},
    {...good,sourceRevision:'main'},
    {...good,customerDisplayAuthorized:true},
    {...good,summary:{distinctQueries:2}},
    {...good,plan:{...good.plan,oauthVerified:true}},
    {...good,pages:[{...good.pages[0],startRow:99}]},
    {...good,pages:[]}
  ])assert.throws(()=>display(input));
});
