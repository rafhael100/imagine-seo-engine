import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeOfflineGscDailySeries as analyze} from '../src/gsc-daily.mjs';

const scope={tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:7};
const row=(date,clicks=2,impressions=20)=>({
  keys:[date],clicks,impressions,ctr:clicks/impressions,position:8
});
test('F52 normalizes date rows, sorts dates and preserves missing-date uncertainty',()=>{
  const result=analyze({rows:[
    row('2026-10-03',1,10),row('2026-10-01',2,20)
  ],responseAggregationType:'byProperty',metadata:{}},scope);
  assert.equal(result.period.requestedDays,7);
  assert.equal(result.period.returnedDays,2);
  assert.equal(result.period.unreturnedDays,5);
  assert.deepEqual(result.daily.map(x=>x.date),['2026-10-01','2026-10-03']);
  assert.equal(result.summary.clicks,3);
  assert.equal(result.summary.impressions,30);
  assert.equal(result.summary.ctr,0.1);
  assert.equal(result.summary.weightedAveragePosition,8);
  assert.equal(result.mayHaveMore,false);
  assert.equal(result.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
  assert.equal(result.productionReadAuthorized,false);
  assert.equal(result.networkPerformed,false);
  assert.doesNotMatch(JSON.stringify(result),/sc-domain:example/);
});
test('F52 rejects duplicate dates, impossible dates and outside-window dates',()=>{
  for(const rows of [
    [row('2026-10-01'),row('2026-10-01')],
    [row('2026-02-30')],
    [row('2026-10-08')],
    [row('secret@example.com')]
  ])assert.throws(()=>analyze({rows},scope),/invalid date row|duplicate or out-of-period date/);
});
test('F52 refuses forged auth fields, invalid aggregation and incomplete metadata',()=>{
  const valid=row('2026-10-03');
  for(const payload of [
    {rows:[valid],oauthVerified:true},
    {rows:[{...valid,access_token:'secret'}]},
    {rows:[valid],responseAggregationType:'byPage'},
    {rows:[valid],metadata:{first_incomplete_date:null}},
    {rows:[valid],metadata:{first_incomplete_hour:false}},
    {rows:[valid],metadata:{verified:true}},
    {rows:[valid],metadata:null}
  ])assert.throws(()=>analyze(payload,scope));
});
test('F52 rejects bad metrics, overflow and invalid period or property',()=>{
  const valid=row('2026-10-03');
  for(const bad of [
    {...valid,clicks:21},
    {...valid,impressions:-1},
    {...valid,ctr:0.75},
    {...valid,position:0},
    {...valid,clicks:'2'},
    {...valid,ctr:NaN}
  ])assert.throws(()=>analyze({rows:[bad]},scope),/invalid row metrics/);
  for(const config of [
    {...scope,startDate:'2026-02-30'},
    {...scope,endDate:'2026-09-30'},
    {...scope,propertyFingerprint:'fake'},
    {...scope,tenantRef:'another tenant'},
    {...scope,rowLimit:93},
    {...scope,networkPerformed:true}
  ])assert.throws(()=>analyze({rows:[]},config),/invalid reporting period|invalid offline scope|unsupported contract/);
});
test('F52 refuses hidden fields and unknown response state',()=>{
  const raw={rows:[row('2026-10-03')]};
  Object.defineProperty(raw,'oauthVerified',{value:true});
  assert.throws(()=>analyze(raw,scope),/unsupported contract/);
  const inherited=Object.assign(Object.create({oauthVerified:true}),{rows:[]});
  assert.throws(()=>analyze(inherited,scope),/unsupported contract/);
});
test('F52 reports possible pagination when exactly at the row limit',()=>{
  const output=analyze({rows:[row('2026-10-03')]},{...scope,rowLimit:1});
  assert.equal(output.mayHaveMore,true);
  assert.equal(output.period.unreturnedDays,6);
});
test('F52 empty response never fabricates zero-value dates',()=>{
  const output=analyze({rows:[]},scope);
  assert.equal(output.daily.length,0);
  assert.equal(output.period.unreturnedDays,7);
  assert.equal(output.summary.clicks,0);
  assert.equal(output.summary.weightedAveragePosition,null);
});
