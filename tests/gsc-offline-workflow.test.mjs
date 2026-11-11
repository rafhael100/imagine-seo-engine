import test from 'node:test';
import assert from 'node:assert/strict';
import {planGscQuery} from '../src/gsc-readonly.mjs';
import {reviewOfflineGscReadiness} from '../src/gsc-offline-workflow.mjs';

const params={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',authorizationConfirmed:true,rowLimit:2};
const plan=()=>planGscQuery(params);
const entry={siteUrl:params.siteUrl,permissionLevel:'siteRestrictedUser'};
const row=(q,clicks)=>({keys:[q],clicks,impressions:10,ctr:clicks/10,position:8});
const fixture=()=>({
  tenantRef:params.tenantRef,requestedProperty:params.siteUrl,
  listedProperties:[entry],plan:plan(),pages:[{
    startRow:0,rows:[row('seo para empresas',2),row('person@example.com',1)]
  }]
});
test('F50 composes scoped offline GSC review and strips raw queries',()=>{
  const result=reviewOfflineGscReadiness(fixture());
  assert.equal(result.status,'OFFLINE_REVIEW_ONLY');
  assert.equal(result.summary.inputRows,2);
  assert.equal(result.summary.redactedRows,1);
  assert.equal(result.summary.clicks,2);
  assert.equal(result.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
  for(const key of ['oauthVerified','backendTenantGrantVerified',
    'propertyConsentVerified','customerDisplayAuthorized',
    'productionReadAuthorized','networkPerformed'])
    assert.equal(result[key],false);
  assert.doesNotMatch(JSON.stringify(result),/person@example.com|seo para empresas|example.com/);
});
test('F50 denies processing when requested property is not eligible',()=>{
  const base=fixture();
  for(const listedProperties of [
    [],[{...entry,siteUrl:'sc-domain:unrelated.example'}],
    [{...entry,permissionLevel:'siteUnverifiedUser'}]
  ]){
    const result=reviewOfflineGscReadiness({...base,listedProperties});
    assert.equal(result.status,'DECLARED_PROPERTY_NOT_ELIGIBLE');
    assert.equal(result.summary,null);
    assert.equal(result.productionReadAuthorized,false);
  }
});
test('F50 blocks forged plans and cross-tenant fingerprints',()=>{
  const base=fixture();
  for(const bad of [
    {...base,plan:{...base.plan,tenantRef:'another-tenant'}},
    {...base,plan:{...base.plan,propertyFingerprint:'a'.repeat(64)}},
    {...base,pages:[{startRow:0,rows:[row('one',2)],oauthVerified:true}]}
  ])assert.throws(()=>reviewOfflineGscReadiness(bad));
});
test('F50 rejects unknown or hidden workflow-level authorization fields',()=>{
  const base=fixture();
  const hidden={...base};
  Object.defineProperty(hidden,'oauthVerified',{value:true});
  for(const bad of [{...base,oauthVerified:true},hidden,[]])
    assert.throws(()=>reviewOfflineGscReadiness(bad),/strict offline input/);
});
