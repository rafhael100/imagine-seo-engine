import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compareOfflineGscQueryPageOverlapPeriods as compare}
  from '../src/gsc-query-page-overlap-trend.mjs';

const siteUrl='sc-domain:example.com';
const base={tenantRef:'imagine-demo',siteUrl,
  propertyFingerprint:createHash('sha256').update(siteUrl).digest('hex'),
  rowLimit:30};
function response(overlapping=1){
  const rows=[];
  for(let i=0;i<10;i++){
    const term='marketing-project-'+String(i+1);
    rows.push({keys:[term,'https://www.example.com/page-'+i],
      clicks:0,impressions:100,ctr:0,position:8});
    if(i<overlapping)rows.push({
      keys:[term,'https://www.example.com/other-'+i],
      clicks:0,impressions:100,ctr:0,position:8});
  }
  rows.forEach((row,index)=>{
    row.clicks=99-index;
    row.ctr=row.clicks/row.impressions;
  });
  return {rows,responseAggregationType:'byPage'};
}
function fixture(){
  return {
    previous:{scope:{...base,startDate:'2026-10-01',endDate:'2026-10-07'},
      response:response(1)},
    current:{scope:{...base,startDate:'2026-10-08',endDate:'2026-10-14'},
      response:response(5)}
  };
}
test('F65 compares overlap share across equally sized periods without raw queries',()=>{
  const result=compare(fixture());
  assert.equal(result.contractVersion,'seo-gsc-query-page-overlap-trend-offline-v1');
  assert.equal(result.comparisonDays,7);
  assert.equal(result.coverageComplete,true);
  assert.equal(result.previous.distinctQueries,10);
  assert.equal(result.previous.queriesOnMultiplePages,1);
  assert.equal(result.previous.overlapShare,.1);
  assert.equal(result.current.queriesOnMultiplePages,5);
  assert.equal(result.current.overlapShare,.5);
  assert.equal(result.overlapShareChange,.4);
  assert.deepEqual(result.reviewSignals,['review_overlap_share_increase']);
  assert.equal(result.networkPerformed,false);
  assert.equal(result.customerDisplayAuthorized,false);
  assert.doesNotMatch(JSON.stringify(result),
    /marketing-project|https:\/\/www\.example\.com|\/page-/);
});
test('F65 does not suggest trend changes for possibly incomplete page responses',()=>{
  const input=fixture();
  input.current.scope.rowLimit=input.current.response.rows.length;
  const result=compare(input);
  assert.equal(result.coverageComplete,false);
  assert.equal(result.coverageStatus,'PARTIAL_GSC_BATCHES_NO_SIGNALS');
  assert.equal(result.overlapShareChange,null);
  assert.deepEqual(result.reviewSignals,[]);
});
test('F65 rejects comparisons across tenants, properties, and window sizes',()=>{
  for(const change of [
    {tenantRef:'other-tenant'},
    {siteUrl:'sc-domain:other.com',
      propertyFingerprint:createHash('sha256').update('sc-domain:other.com').digest('hex')},
    {startDate:'2026-10-07'},
    {endDate:'2026-10-16'}
  ]){
    const input=fixture();
    input.current.scope={...input.current.scope,...change};
    assert.throws(()=>compare(input));
  }
});
test('F65 rejects spoofed authorizations and extra envelope fields',()=>{
  const good=fixture();
  for(const input of [
    {...good,oauthVerified:true},
    {...good,current:{...good.current,productionReadAuthorized:true}},
    {...good,previous:{...good.previous,
      response:{...good.previous.response,metadata:{first_incomplete_date:null}}}}
  ])assert.throws(()=>compare(input));
});
test('F65 empty prior period never invents percent growth or review signals',()=>{
  const input=fixture();
  input.previous.response={rows:[]};
  const result=compare(input);
  assert.equal(result.previous.overlapShare,null);
  assert.equal(result.overlapShareChange,null);
  assert.deepEqual(result.reviewSignals,[]);
});
test('F65 refuses personal page params without leaking token or blocking safe rows',()=>{
  const input=fixture();
  const marker='PERSONAL-SECRET-OVERLAP';
  input.current.response.rows[1].keys[1]=
    'https://example.com/private?token='+marker;
  const result=compare(input);
  assert.equal(result.current.redactedRows,1);
  assert.doesNotMatch(JSON.stringify(result),new RegExp(marker));
  assert.equal(result.productionReadAuthorized,false);
});

test('F67 suppresses trend deltas and signals when current rows are redacted',()=>{
  const input=fixture();
  const secret='SENSITIVE-F67-SECRET';
  input.current.response.rows[1].keys[1]=
    'https://example.com/private?token='+secret;
  const result=compare(input);
  assert.equal(result.current.redactedRows,1);
  assert.equal(result.coverageComplete,false);
  assert.equal(result.coverageStatus,'REDACTED_GSC_ROWS_NO_SIGNALS');
  assert.equal(result.overlapShareChange,null);
  assert.deepEqual(result.reviewSignals,[]);
  assert.doesNotMatch(JSON.stringify(result),new RegExp(secret));
});
test('F67 suppresses trend signals when previous rows are redacted',()=>{
  const input=fixture();
  input.previous.response.rows[1].keys[1]=
    'https://example.com/private?session=REDACTED-PRIOR';
  const result=compare(input);
  assert.equal(result.previous.redactedRows,1);
  assert.equal(result.coverageComplete,false);
  assert.equal(result.overlapShareChange,null);
  assert.deepEqual(result.reviewSignals,[]);
  assert.doesNotMatch(JSON.stringify(result),/REDACTED-PRIOR/);
});
