import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeScopedGscCsv,compareScopedGscCsv} from '../src/scoped-gsc.mjs';

const scope={tenantRef:'imagine-demo',property:'https://example.com/',
  authorizationConfirmed:true};
const data=(startDate,endDate,query='landing pages')=>({
  scope,startDate,endDate,
  csv:'Queries,Clicks,Impressions,CTR,Position\n'+
    '"'+query+'",20,200,10%,8\n'+
    '"pessoa@empresa.com",1,10,10%,4\n'
});
const previous=()=>data('2026-10-01','2026-10-07');
const current=()=>({...data('2026-10-08','2026-10-14'),
  csv:data('2026-10-08','2026-10-14').csv.replace('20,200,10%,8','12,200,6%,8')});

test('scoped report exposes only aggregated clusters and fingerprints',()=>{
  const result=analyzeScopedGscCsv(previous());
  assert.equal(result.contractVersion,'seo-scoped-offline-v1');
  assert.equal(result.summary.clicks,20);
  assert.equal(result.summary.redactedRows,1);
  assert.equal(result.scope.tenantRef,'imagine-demo');
  assert.match(result.scope.propertyFingerprint,/^[0-9a-f]{64}$/);
  assert.match(result.sourceFingerprint,/^[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(result),/landing pages|pessoa@empresa.com|example.com/);
});
test('scope can be used in equal-window offline comparisons',()=>{
  const result=compareScopedGscCsv(previous(),current());
  assert.equal(result.summary.days,7);
  assert.equal(result.scope.tenantRef,'imagine-demo');
  assert.notEqual(result.sourceFingerprints.previous,result.sourceFingerprints.current);
});
test('cross-tenant and cross-property comparisons fail closed',()=>{
  assert.throws(()=>compareScopedGscCsv(previous(),{
    ...current(),scope:{...scope,tenantRef:'other-tenant'}
  }),/mismatched tenant or property/);
  assert.throws(()=>compareScopedGscCsv(previous(),{
    ...current(),scope:{...scope,property:'https://another-example.com/'}
  }),/mismatched tenant or property/);
});
test('explicit operator declaration required, not treated as OAuth verification',()=>{
  assert.throws(()=>analyzeScopedGscCsv({
    ...previous(),scope:{...scope,authorizationConfirmed:false}
  }),/operator authorization declaration/);
  assert.equal(analyzeScopedGscCsv(previous()).scope.authorization,
    'operator_declared_not_independently_verified');
});
test('rejects unsafe site property identifiers without contacting a server',()=>{
  for(const property of ['http://example.com/','https://me:password@example.com/',
    'https://example.com/?token=secret','https://localhost/','sc-domain:localhost']) {
    assert.throws(()=>analyzeScopedGscCsv({
      ...previous(),scope:{...scope,property}
    }),/SEO scope:/);
  }
});
test('keeps source private even when CSV fails validation',()=>{
  assert.throws(()=>analyzeScopedGscCsv({
    ...previous(),csv:'Queries,Clicks,Impressions,CTR,Position\n"secret,1,100,1%,8'
  }),/unclosed quote/);
});
