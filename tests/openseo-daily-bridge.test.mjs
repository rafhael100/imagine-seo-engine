import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineOpenSeoDailySnapshot as review} from '../src/openseo-daily-bridge.mjs';

const property='sc-domain:imaginecomunicacao.com.br';
const fingerprint=createHash('sha256').update(property).digest('hex');
const row=(date,clicks=1,impressions=10)=>({
  keys:[date],clicks,impressions,ctr:impressions?clicks/impressions:0,
  position:impressions?8:null
});
const snapshot=(changes={})=>({
  siteUrl:property,startDate:'2026-10-15',endDate:'2026-10-17',
  dimensions:['date'],rows:[row('2026-10-15'),row('2026-10-17',2,20)],
  rowCount:2,hasMore:false,...changes
});
const input=(changes={})=>({
  tenantRef:'imagine-demo',expectedProperty:property,snapshot:snapshot(),...changes
});

test('F104 turns date-only supplied OpenSEO rows into a safe, scoped offline review',()=>{
  const result=review(input());
  assert.equal(result.contractVersion,'seo-openseo-daily-offline-review-v1');
  assert.equal(result.propertyFingerprint,fingerprint);
  assert.equal(result.period.requestedDays,3);
  assert.equal(result.period.returnedDays,2);
  assert.equal(result.period.unreturnedDays,1);
  assert.equal(result.summary.clicks,3);
  assert.equal(result.summary.impressions,30);
  assert.equal(result.summary.ctr,0.1);
  assert.deepEqual(result.daily.map(x=>x.date),['2026-10-15','2026-10-17']);
  for(const key of ['oauthVerifiedForImagine','portalTenantGrantVerified',
    'customerDisplayAuthorized','productionReadAuthorized','networkPerformed'])
    assert.equal(result[key],false,key);
  assert.equal(result.sourceCompletenessNotProven,true);
  assert.equal(result.releaseStatus,'HOLD_IMAGINE_BACKEND_AUTHORIZATION');
  assert.doesNotMatch(JSON.stringify(result),/imaginecomunicacao.com.br|http:|@example/);
});
test('F104 rejects cross-property snapshots, including domain vs URL-prefix even on the same domain',()=>{
  for(const siteUrl of [
    'sc-domain:example.net','https://imaginecomunicacao.com.br/',
    'https://www.imaginecomunicacao.com.br/'
  ]){
    assert.throws(()=>review(input({snapshot:snapshot({siteUrl})})),
      /source and expected property differ/);
  }
});
test('F104 blocks different tenant scopes and caller-declared credentials',()=>{
  for(const scope of [
    input({tenantRef:'not a tenant'}),input({tenantRef:'x'}),
    {...input(),oauthVerifiedForImagine:true},
    input({snapshot:{...snapshot(),access_token:'sensitive'}}),
    input({snapshot:{...snapshot(),customerDisplayAuthorized:true}})
  ])assert.throws(()=>review(scope),/exact offline snapshot and tenant|complete date-only snapshot/);
});
test('F104 only accepts date dimension and fully observed pages of snapshots',()=>{
  for(const bad of [
    {dimensions:['query']},{dimensions:['page']},{dimensions:['date','country']},
    {rowCount:8},{hasMore:true},{hasMore:undefined},{rows:'not rows'},
    {rows:new Array(2),rowCount:2}
  ])assert.throws(()=>review(input({snapshot:snapshot(bad)})),
    /complete date-only snapshot required/);
});
test('F104 rejects invented totals, per-query URLs, duplicates and invalid metrics',()=>{
  for(const badRows of [
    [{...row('2026-10-15'),query:'private@example.net'}],
    [row('2026-10-15'),row('2026-10-15')],
    [row('2026-10-16',11,10)],
    [row('2026-10-16',1,10),row('2026-10-18')],
    [row('2026-10-16',1,10),row('2026-10-17',1,10),row('2026-10-17',1,10)]
  ]){
    const snap=snapshot({rows:badRows,rowCount:badRows.length});
    assert.throws(()=>review(input({snapshot:snap})));
  }
});
test('F104 refuses prototype, accessor, hidden and symbol-based payloads before reading source data',()=>{
  const getter=Object.defineProperty(snapshot(),'rows',{
    enumerable:true,get(){throw Error('SECRET_VALUE_LEAK');}
  });
  assert.throws(()=>review(input({snapshot:getter})),
    /exact offline snapshot/);
  const hidden=snapshot();
  Object.defineProperty(hidden,'oauthVerified',{value:true});
  assert.throws(()=>review(input({snapshot:hidden})),/exact offline snapshot/);
  const symbol=snapshot();
  symbol[Symbol('permission')]=true;
  assert.throws(()=>review(input({snapshot:symbol})),/exact offline snapshot/);
  assert.throws(()=>review(input({snapshot:Object.assign(
    Object.create({oauthVerified:true}),snapshot())})),/exact offline snapshot/);
  const pollutedInput=Object.assign(Object.create({customerDisplayAuthorized:true}),input());
  assert.throws(()=>review(pollutedInput),/exact offline snapshot/);
});
test('F104 empty snapshot cannot invent traffic and always keeps production authorization false',()=>{
  const result=review(input({snapshot:snapshot({rows:[],rowCount:0})}));
  assert.equal(result.period.unreturnedDays,3);
  assert.equal(result.summary.impressions,0);
  assert.equal(result.sourceCompletenessNotProven,true);
  assert.equal(result.productionReadAuthorized,false);
});
