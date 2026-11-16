import test from 'node:test';
import assert from 'node:assert/strict';
import {compareOfflineGscDailyPeriods as compare} from '../src/gsc-daily-compare.mjs';

const scope=(startDate,endDate,overrides={})=>({
  tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
  startDate,endDate,rowLimit:92,...overrides
});
const row=(date,clicks,impressions,position=8)=>({
  keys:[date],clicks,impressions,ctr:clicks/impressions,position
});
const fixture=()=>({
  previous:{
    scope:scope('2026-10-01','2026-10-02'),
    response:{rows:[
      row('2026-10-01',30,250,5),row('2026-10-02',30,250,5)
    ]}
  },
  current:{
    scope:scope('2026-10-03','2026-10-04'),
    response:{rows:[
      row('2026-10-03',10,100,9),row('2026-10-04',10,100,9)
    ]}
  }
});
test('F54 flags well-evidenced decline only when both full date windows are returned',()=>{
  const out=compare(fixture());
  assert.equal(out.contractVersion,'seo-gsc-daily-comparison-offline-v1');
  assert.equal(out.coverageStatus,'COMPLETE_SUPPLIED_DATE_COVERAGE');
  assert.equal(out.coverageComplete,true);
  assert.equal(out.previous.impressions,500);
  assert.equal(out.current.impressions,200);
  assert.equal(out.change.impressionsFraction,-0.6);
  assert.equal(out.change.clicksFraction,-0.667);
  assert.equal(out.change.averagePositionDifference,4);
  assert.deepEqual(out.reviewSignals,[
    'review_impression_drop','review_click_drop','review_average_position_decline'
  ]);
  assert.equal(out.networkPerformed,false);
  assert.equal(out.customerDisplayAuthorized,false);
  assert.equal(out.productionReadAuthorized,false);
  assert.equal(out.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
  assert.doesNotMatch(JSON.stringify(out),/sc-domain:example.com|private@example.com/);
});
test('F54 partial dates cannot generate false drop or CTR alerts',()=>{
  const original=fixture();
  original.current.response.rows=[];
  const out=compare(original);
  assert.equal(out.coverageComplete,false);
  assert.equal(out.coverageStatus,'PARTIAL_DATA_NO_TREND_SIGNALS');
  assert.deepEqual(out.reviewSignals,[]);
  assert.equal(out.change.ctrPercentagePoints,null);
  assert.equal(out.change.averagePositionDifference,null);
  assert.equal(out.periods.current.unreturnedDays,2);
});
test('F54 possible pagination remains hold even when all dates appear',()=>{
  const pair=fixture();
  pair.current.scope.rowLimit=2;
  const out=compare(pair);
  assert.equal(out.coverageComplete,false);
  assert.deepEqual(out.reviewSignals,[]);
});
test('F54 rejects cross-tenant or different-property comparisons',()=>{
  for(const overrides of [
    {tenantRef:'another-company'},
    {propertyFingerprint:'b'.repeat(64)}
  ]){
    const pair=fixture();
    pair.current.scope={...pair.current.scope,...overrides};
    assert.throws(()=>compare(pair),/mismatched tenant or property/);
  }
});
test('F54 refuses reversed, overlapping or uneven reporting windows',()=>{
  const bad=[
    {startDate:'2026-10-01',endDate:'2026-10-02'},
    {startDate:'2026-10-02',endDate:'2026-10-03'},
    {startDate:'2026-10-05',endDate:'2026-10-05'}
  ];
  for(const props of bad){
    const pair=fixture();
    pair.current.scope={...pair.current.scope,...props};
    pair.current.response.rows=[];
    assert.throws(()=>compare(pair),/equal non-overlapping periods required/);
  }
});
test('F54 rejects forged authorizations and unexpected wrapper fields',()=>{
  const valid=fixture();
  const adversarial=[
    {...valid,oauthVerified:true},
    {...valid,current:{...valid.current,networkPerformed:true}},
    {...valid,previous:{...valid.previous,response:{
      ...valid.previous.response,metadata:{first_incomplete_date:null}
    }}}
  ];
  const symbol={...valid,[Symbol('token')]:true};
  adversarial.push(symbol);
  for(const entry of adversarial)assert.throws(()=>compare(entry));
});
test('F54 no baseline gives null fraction instead of invented unlimited growth',()=>{
  const pair=fixture();
  pair.previous.response.rows=[
    row('2026-10-01',0,100),row('2026-10-02',0,100)
  ];
  const out=compare(pair);
  assert.equal(out.change.clicksFraction,null);
  assert.deepEqual(out.reviewSignals,[]);
});
