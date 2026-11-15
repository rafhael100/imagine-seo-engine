import test from 'node:test';
import assert from 'node:assert/strict';
import {compareOfflineOpenSeoDailyPeriods as compare}
  from '../src/openseo-daily-compare.mjs';

const property='sc-domain:example.com';
const row=(date,clicks,impressions,position=8)=>({
  keys:[date],clicks,impressions,ctr:impressions?clicks/impressions:0,
  position:impressions?position:null
});
const snapshot=(startDate,endDate,rows,changes={})=>({
  tenantRef:'demo-tenant',
  expectedProperty:property,
  snapshot:{
    siteUrl:property,startDate,endDate,dimensions:['date'],
    rows,rowCount:rows.length,hasMore:false
  },
  ...changes
});
const previous=()=>snapshot('2026-10-01','2026-10-03',[
  row('2026-10-01',10,100),row('2026-10-02',10,100),
  row('2026-10-03',10,100)
]);
const current=()=>snapshot('2026-10-04','2026-10-06',[
  row('2026-10-04',5,50,12),row('2026-10-05',5,50,12),
  row('2026-10-06',5,50,12)
]);

test('F105 compares adjacent complete submitted date windows without emitting alerts',()=>{
  const result=compare({previous:previous(),current:current()});
  assert.equal(result.contractVersion,'seo-openseo-daily-comparison-offline-v1');
  assert.equal(result.comparisonDays,3);
  assert.equal(result.submittedDateCoverageComplete,true);
  assert.equal(result.sourceCompletenessNotProven,true);
  assert.equal(result.change.clicksPercent,-50);
  assert.equal(result.change.impressionsPercent,-50);
  assert.equal(result.change.ctrPercentagePoints,0);
  assert.equal(result.change.averagePositionDifference,4);
  assert.deepEqual(result.reviewSignals,[]);
  assert.equal(result.coverageStatus,'ALL_DATES_SUBMITTED_ORIGIN_UNVERIFIED');
  for(const key of ['oauthVerifiedForImagine','portalTenantGrantVerified',
    'customerDisplayAuthorized','productionReadAuthorized','networkPerformed'])
    assert.equal(result[key],false);
  assert.doesNotMatch(JSON.stringify(result),/example.com|googleapis.com/);
});

test('F105 partial date coverage suppresses every change, not just alerts',()=>{
  const p=previous();
  p.snapshot.rows.pop();
  p.snapshot.rowCount=2;
  const result=compare({previous:p,current:current()});
  assert.equal(result.submittedDateCoverageComplete,false);
  assert.equal(result.coverageStatus,'PARTIAL_SUBMITTED_DATES_NO_COMPARISON');
  assert.deepEqual(Object.values(result.change),[null,null,null,null]);
  assert.deepEqual(result.reviewSignals,[]);
});

test('F105 never divides by zero in baseline, or invents average position',()=>{
  const p=previous();
  p.snapshot.rows=p.snapshot.rows.map(r=>row(r.keys[0],0,0));
  const result=compare({previous:p,current:current()});
  assert.equal(result.change.clicksPercent,null);
  assert.equal(result.change.impressionsPercent,null);
  assert.equal(result.change.averagePositionDifference,null);
  assert.equal(result.change.ctrPercentagePoints,10);
});

test('F105 rejects cross-tenant and cross-property requests',()=>{
  const tenant=current();
  tenant.tenantRef='other-tenant';
  assert.throws(()=>compare({previous:previous(),current:tenant}),
    /tenant or property mismatch/);
  const propertyMismatch=current();
  propertyMismatch.expectedProperty='sc-domain:different.example';
  propertyMismatch.snapshot.siteUrl='sc-domain:different.example';
  assert.throws(()=>compare({previous:previous(),current:propertyMismatch}),
    /tenant or property mismatch/);
});

test('F105 rejects gaps, overlaps, reversed windows and unequal durations',()=>{
  const variants=[
    snapshot('2026-10-03','2026-10-05',[row('2026-10-03',1,10)]),
    snapshot('2026-10-05','2026-10-07',[row('2026-10-05',1,10)]),
    snapshot('2026-09-28','2026-09-30',[row('2026-09-28',1,10)]),
    snapshot('2026-10-04','2026-10-05',[row('2026-10-04',1,10)])
  ];
  for(const c of variants)
    assert.throws(()=>compare({previous:previous(),current:c}),
      /adjacent equal-length periods required/);
});

test('F105 validates original snapshots, not caller-provided authorized DTOs',()=>{
  const forged={...current(),productionReadAuthorized:true};
  assert.throws(()=>compare({previous:previous(),current:forged}),
    /exact offline snapshot/);
  const altered=current();
  altered.snapshot.rows[0].query='private query';
  assert.throws(()=>compare({previous:previous(),current:altered}),
    /invalid date-only row/);
  const withAccessor=current();
  Object.defineProperty(withAccessor.snapshot,'rows',{
    enumerable:true,get(){throw Error('PRIVATE_PATH_LEAK');}
  });
  assert.throws(()=>compare({previous:previous(),current:withAccessor}),
    /exact offline snapshot/);
});

test('F105 rejects extra fields, hidden keys, symbols and getters in pair',()=>{
  assert.throws(()=>compare({...{previous:previous(),current:current()},oauth:true}),
    /exact pair/);
  const hidden={previous:previous(),current:current()};
  Object.defineProperty(hidden,'secret',{value:'SECRET'});
  assert.throws(()=>compare(hidden),/exact pair/);
  const withSymbol={previous:previous(),current:current()};
  withSymbol[Symbol('claim')]=true;
  assert.throws(()=>compare(withSymbol),/exact pair/);
  const withGetter={previous:previous()};
  Object.defineProperty(withGetter,'current',{
    enumerable:true,get(){throw Error('PRIVATE_PATH_LEAK');}
  });
  assert.throws(()=>compare(withGetter),/exact pair/);
});
