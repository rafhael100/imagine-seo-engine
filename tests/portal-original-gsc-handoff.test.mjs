import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareOfflinePortalSeoFromOriginalGsc as prepare}
  from '../src/portal-original-gsc-handoff.mjs';

const row=(q,c,i)=>({keys:[q],clicks:c,impressions:i,ctr:c/i,position:8});
const audit=()=>({
  summary:{pages:2,errors:1,warnings:0},
  errors:[{type:'wrong_canonical',file:'PRIVATE-F88-PAGE.html',
    message:'PRIVATE-F88-AUDIT'}],
  warnings:[],routes:['/','/PRIVATE-F88-ROUTE']
});
const fixture=()=>({
  audit:audit(),
  previous:{
    dimensions:['query'],startDate:'2026-10-01',endDate:'2026-10-07',
    rows:[row('PRIVATE-F88-SEARCH landing pages',30,300)]
  },
  current:{
    dimensions:['query'],startDate:'2026-10-08',endDate:'2026-10-14',
    rows:[row('PRIVATE-F88-SEARCH landing pages',8,180)]
  },
  scope:{
    tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    sourceRevision:'b'.repeat(40)
  }
});
function safe(result){
  for(const flag of [
    'oauthVerified','propertyAuthorizationVerified','backendTenantGrantVerified',
    'customerDisplayAuthorized','publicationAuthorized','networkPerformed'
  ])assert.equal(result[flag],false);
  assert.equal(result.handoff.customerDisplayAuthorized,false);
  assert.equal(result.handoff.publicationAuthorized,false);
  assert.equal(result.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  assert.doesNotMatch(JSON.stringify(result),
    /PRIVATE-F88|123\.456\.789-09|pessoa@example\.com/);
}

test('F88 rebuilds technical/organic brief and Portal envelope from original clean rows',()=>{
  const result=prepare(fixture());
  assert.equal(result.contractVersion,'seo-portal-original-gsc-handoff-offline-v1');
  assert.equal(result.coverage.metricsWithheld,false);
  assert.equal(result.coverage.redactedRows,0);
  assert.equal(result.brief.organic.previous.clicks,30);
  assert.equal(result.brief.organic.current.clicks,8);
  assert.equal(result.handoff.organic.previous.clicks,30);
  assert.ok(result.handoff.suggestedReviews.some(x=>x.code==='repair_canonical'));
  assert.ok(result.handoff.suggestedReviews.some(x=>x.code==='review_click_drop'));
  assert.deepEqual(prepare(fixture()),result);
  safe(result);
});

test('F88 hides redacted organic metrics even when technical audit has important findings',()=>{
  for(const key of ['previous','current']){
    const payload=fixture();
    payload[key].rows.push(row('123.456.789-09',1,100));
    const result=prepare(payload);
    assert.equal(result.coverage.metricsWithheld,true);
    assert.equal(result.coverage.reason,'PRIVACY_REDACTION');
    assert.equal(result.coverage.redactedRows,1);
    assert.equal(result.brief.organic,null);
    assert.equal(result.handoff.organic,null);
    assert.deepEqual(result.brief.recommendedReviews.map(x=>x.code),
      ['repair_canonical']);
    assert.deepEqual(result.handoff.suggestedReviews.map(x=>x.code),
      ['repair_canonical']);
    assert.deepEqual(result.coverage.receivedRows,{
      previous:key==='previous'?2:1,current:key==='current'?2:1
    });
    safe(result);
  }
});

test('F88 blocks caller-computed aggregate, fake grants and scope extras',()=>{
  const good=fixture();
  const invalid=[
    {...good,summary:{redactedRows:0}},
    {...good,trend:{summary:{redactedRows:0}}},
    {...good,publicationAuthorized:true},
    {...good,scope:{...good.scope,oauthVerified:true}},
    {...good,previous:{...good.previous,redactedRows:0}},
    {...good,previous:{...good.previous,
      rows:[{...good.previous.rows[0],queryFingerprint:'PRIVATE-F88'}]}},
    {...good,current:{...good.current,rows:[
      good.current.rows[0],good.current.rows[0]
    ]}},
    {...good,previous:{...good.previous,
      dimensions:['query','page']}},
    {...good,scope:{...good.scope,sourceRevision:'main'}},
    {brief:prepare(good).brief,handoff:prepare(good).handoff}
  ];
  for(const payload of invalid)
    assert.throws(()=>prepare(payload),{name:'Error'});
});

test('F88 rejects accessor scopes, forged row arrays and impossible periods',()=>{
  const access=fixture();
  Object.defineProperty(access.scope,'tenantRef',{
    enumerable:true,get(){throw Error('PRIVATE-F88-GETTER');}
  });
  assert.throws(()=>prepare(access),/original evidence and offline scope required/);
  const sparse=fixture();
  sparse.current.rows=Array(1);
  assert.throws(()=>prepare(sparse),/original query export/);
  const forged=fixture();
  forged.previous.rows[Symbol.iterator]=function*(){
    yield row('private@example.com',1,100);
  };
  assert.throws(()=>prepare(forged),/original query export/);
  const wrongDate=fixture();
  wrongDate.current.startDate='2026-10-07';
  assert.throws(()=>prepare(wrongDate),/overlap|equal windows|period/);
});

test('F88 handles zero GSC rows without inventing organic changes',()=>{
  const payload=fixture();
  payload.previous.rows=[];payload.current.rows=[];
  const out=prepare(payload);
  assert.equal(out.coverage.metricsWithheld,false);
  assert.equal(out.brief.organic.previous.clicks,0);
  assert.equal(out.brief.organic.clicksChangeFraction,null);
  assert.deepEqual(out.handoff.suggestedReviews.map(x=>x.code),['repair_canonical']);
  safe(out);
});

test('F89 Unicode disguised identifiers suppress original GSC trends and Portal handoff',()=>{
  const disguised=[
    '１２３．４５６．７８９－０９',
    'CPF\u200b 12345678909',
    '123.\u2060456.789-09',
    'pessoa＠exemplo.com',
    '１２．３４５．６７８／０００１－９０'
  ];
  for(const query of disguised)
  for(const period of ['previous','current']){
    const input=fixture();
    input[period].rows.push(row(query,1,100));
    const result=prepare(input);
    assert.equal(result.coverage.metricsWithheld,true);
    assert.equal(result.coverage.reason,'PRIVACY_REDACTION');
    assert.equal(result.coverage.redactedRows,1);
    assert.equal(result.brief.organic,null);
    assert.equal(result.handoff.organic,null);
    assert.deepEqual(result.handoff.suggestedReviews.map(x=>x.code),
      ['repair_canonical']);
    assert.ok(!JSON.stringify(result).includes(query));
    safe(result);
  }
});
