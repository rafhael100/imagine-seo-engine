import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOfflineDailySeoBrief as build} from '../src/gsc-daily-brief.mjs';
import {preparePortalSeoHandoff} from '../src/portal-handoff.mjs';
const audit=()=>({
  summary:{pages:3,errors:1,warnings:0},
  errors:[{type:'wrong_canonical',file:'private/customer.html',message:'SECRET-PERSONAL'}],
  warnings:[],routes:['/','/private/customer.html']
});
const scope=(startDate,endDate)=>({tenantRef:'imagine-demo',
  propertyFingerprint:'a'.repeat(64),startDate,endDate,rowLimit:92});
const row=(date,clicks,impressions,position)=>({
  keys:[date],clicks,impressions,ctr:clicks/impressions,position
});
const input=()=>({
  audit:audit(),
  comparisonInput:{
    previous:{scope:scope('2026-10-01','2026-10-02'),response:{rows:[
      row('2026-10-01',30,250,5),row('2026-10-02',30,250,5)
    ]}},
    current:{scope:scope('2026-10-03','2026-10-04'),response:{rows:[
      row('2026-10-03',10,100,9),row('2026-10-04',10,100,9)
    ]}}
  }
});
test('F56 emits exactly Portal-compatible SEO brief from complete daily evidence',()=>{
  const result=build(input());
  assert.equal(result.contractVersion,'seo-brief-offline-v1');
  assert.equal(result.sourceType,'operator_supplied_offline_reports_unverified');
  assert.equal(result.organic.days,2);
  assert.equal(result.organic.previous.impressions,500);
  assert.equal(result.organic.current.impressions,200);
  assert.equal(result.organic.impressionsChangeFraction,-.6);
  assert.ok(result.recommendedReviews.some(x=>x.code==='repair_canonical'));
  assert.ok(result.recommendedReviews.some(x=>x.code==='review_impression_drop'));
  assert.ok(result.recommendedReviews.some(x=>x.code==='review_click_drop'));
  assert.ok(result.recommendedReviews.some(x=>x.code==='review_average_position'));
  assert.doesNotMatch(JSON.stringify(result),/private\/customer|SECRET-PERSONAL|sc-domain/);
  const handoff=preparePortalSeoHandoff({
    tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    sourceRevision:'b'.repeat(40),brief:result
  });
  assert.equal(handoff.customerDisplayAuthorized,false);
  assert.equal(handoff.productionReadAuthorized,undefined);
  assert.equal(handoff.organic.current.impressions,200);
  assert.equal(handoff.suggestedReviews.length,result.recommendedReviews.length);
});
test('F56 withholds organic review entirely for a partially returned period',()=>{
  const partial=input();
  partial.comparisonInput.current.response.rows.pop();
  const result=build(partial);
  assert.equal(result.organic,null);
  assert.ok(result.recommendedReviews.some(x=>x.code==='repair_canonical'));
  assert.ok(result.recommendedReviews.every(x=>x.code!=='review_impression_drop'));
  assert.match(result.limitations.at(-1),/withheld/);
  const handoff=preparePortalSeoHandoff({
    tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    sourceRevision:'b'.repeat(40),brief:result
  });
  assert.equal(handoff.organic,null);
});
test('F56 rejects forged evidence fields and tenant/property mismatches',()=>{
  const base=input();
  for(const bad of [
    {...base,oauthVerified:true},
    {...base,comparisonInput:{...base.comparisonInput,oauthVerified:true}},
    {...base,comparisonInput:{...base.comparisonInput,
      current:{...base.comparisonInput.current,
        scope:{...base.comparisonInput.current.scope,tenantRef:'another-tenant'}}}},
    {...base,comparisonInput:{...base.comparisonInput,
      current:{...base.comparisonInput.current,
        scope:{...base.comparisonInput.current.scope,propertyFingerprint:'b'.repeat(64)}}}}
  ])assert.throws(()=>build(bad));
});
test('F56 disallows unknown raw query data even if it claims to be harmless',()=>{
  const x=input();
  x.comparisonInput.previous.response.rows[0].keys=['person@example.com'];
  assert.throws(()=>build(x),/invalid date row/);
});
