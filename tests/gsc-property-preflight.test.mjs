import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineGscPropertyPreflight as review} from '../src/gsc-property-preflight.mjs';
const tenantRef='imagine-demo',requestedProperty='sc-domain:imagine.example';
const mk=(siteUrl,permissionLevel='siteOwner')=>({siteUrl,permissionLevel});
const scope=(list,overrides={})=>({tenantRef,requestedProperty,
  listedProperties:list,...overrides});

test('requires an exact declared property match without granting real access',()=>{
  const result=review(scope([
    mk('sc-domain:unrelated.example'),
    mk('sc-domain:imagine.example','siteRestrictedUser')
  ]));
  assert.equal(result.status,'DECLARED_READ_ACCESS_NOT_VERIFIED');
  assert.equal(result.exactPropertyListed,true);
  assert.equal(result.declaredReadPermissionEligible,true);
  assert.equal(result.productionReadAuthorized,false);
  assert.equal(result.oauthVerified,false);
  assert.equal(result.portalTenantGrantVerified,false);
  assert.equal(result.propertyConsentVerified,false);
  assert.equal(result.propertyFingerprint,
    createHash('sha256').update(requestedProperty).digest('hex'));
  assert.doesNotMatch(JSON.stringify(result),/imagine\.example|unrelated\.example|siteRestrictedUser/);
});

test('blocks cross-property mixing when only unrelated sites are listed',()=>{
  const result=review(scope([
    mk('sc-domain:unrelated.example'),
    mk('https://www.another.example/')
  ]));
  assert.equal(result.exactPropertyListed,false);
  assert.equal(result.declaredReadPermissionEligible,false);
  assert.equal(result.status,'PROPERTY_NOT_LISTED');
  assert.equal(result.productionReadAuthorized,false);
});

test('domain properties do not silently match URL-prefix properties',()=>{
  const result=review(scope([mk('https://imagine.example/')]));
  assert.equal(result.exactPropertyListed,false);
  const inverse=review(scope([mk('sc-domain:imagine.example')],{
    requestedProperty:'https://imagine.example/'
  }));
  assert.equal(inverse.exactPropertyListed,false);
});
test('URL-prefix requires same origin and path, not just same hostname',()=>{
  const result=review(scope([mk('https://www.imagine.example/')],{
    requestedProperty:'https://imagine.example/'
  }));
  assert.equal(result.exactPropertyListed,false);
  const otherPath=review(scope([mk('https://imagine.example/sub/')],{
    requestedProperty:'https://imagine.example/'
  }));
  assert.equal(otherPath.exactPropertyListed,false);
});
test('unverified Google property declaration never satisfies read permission',()=>{
  const result=review(scope([mk(requestedProperty,'siteUnverifiedUser')]));
  assert.equal(result.exactPropertyListed,true);
  assert.equal(result.declaredReadPermissionEligible,false);
  assert.equal(result.status,'INSUFFICIENT_DECLARED_PERMISSION');
});
test('empty listing remains an explicit hold',()=>{
  const result=review(scope([]));
  assert.equal(result.propertiesInspected,0);
  assert.equal(result.status,'PROPERTY_NOT_LISTED');
  assert.equal(result.authorization,'HOLD_BACKEND_OAUTH_AND_TENANT_VERIFICATION');
});
test('rejects malformed listings, duplicates and unsupported permission labels',()=>{
  for(const list of [
    [mk(requestedProperty),mk(requestedProperty)],
    [mk(requestedProperty,'owner')],
    [{siteUrl:requestedProperty}],
    [null],
    'not a list',
    Array.from({length:101},()=>mk('sc-domain:other.example'))
  ])assert.throws(()=>review(scope(list)),/GSC preflight:|GSC plan:/);
});
test('invalid properties and tenant values fail closed with generic errors',()=>{
  const bad=[
    {tenantRef:'other tenant'},
    {requestedProperty:'https://person:secret@imagine.example/'},
    {requestedProperty:'http://imagine.example/'},
    {requestedProperty:'sc-domain:localhost'},
    {listedProperties:[mk('https://person:secret@imagine.example/')]}
  ];
  for(const override of bad){
    let error;
    try{review(scope([],override));}catch(e){error=e;}
    assert.ok(error);
    assert.doesNotMatch(error.message,/person:secret|imagine\.example|other tenant/);
  }
});

import {planGscQuery} from '../src/gsc-readonly.mjs';
import {bindOfflineGscPlanToPreflight as bind} from '../src/gsc-property-preflight.mjs';
const planFor=(property='sc-domain:imagine.example',tenant='imagine-demo')=>planGscQuery({
  tenantRef:tenant,siteUrl:property,startDate:'2026-10-01',
  endDate:'2026-10-07',authorizationConfirmed:true
});
test('offline binding joins an exact property and tenant but never grants access',()=>{
  const preflight=review(scope([mk(requestedProperty)]));
  const result=bind({preflight,plan:planFor()});
  assert.equal(result.scopeIntegrityCheckedOffline,true);
  assert.equal(result.productionReadAuthorized,false);
  assert.equal(result.oauthVerified,false);
  assert.equal(result.tenantGrantVerified,false);
  assert.equal(result.networkPerformed,false);
  assert.doesNotMatch(JSON.stringify(result),/imagine\.example|googleapis\.com/);
});
test('offline binding rejects mismatched tenant, property or tampered Google URL',()=>{
  const preflight=review(scope([mk(requestedProperty)])),valid=planFor();
  for(const plan of [
    planFor('sc-domain:another.example'),
    planFor(requestedProperty,'another-tenant'),
    {...valid,url:valid.url.replace('imagine.example','another.example')},
    {...valid,url:'https://malicious.example/webmasters/v3/sites/site/searchAnalytics/query'},
    {...valid,requiredOAuthScope:'https://www.googleapis.com/auth/webmasters'},
    {...valid,body:{...valid.body,type:'image'}},
    {...valid,networkPerformed:true}
  ])assert.throws(()=>bind({preflight,plan}),/SEO GSC binding:/);
});
test('operator-supplied missing property still cannot authorize a read',()=>{
  const preflight=review(scope([]));
  const result=bind({preflight,plan:planFor()});
  assert.equal(result.exactPropertyListed,false);
  assert.equal(result.declaredReadPermissionEligible,false);
  assert.equal(result.productionReadAuthorized,false);
});
test('forged preflight flags or status are rejected',()=>{
  const preflight=review(scope([mk(requestedProperty)])),plan=planFor();
  for(const override of [
    {oauthVerified:true},{tenantRef:'other-tenant'},
    {status:'VERIFIED'},{propertyConsentVerified:true},
    {productionReadAuthorized:true},{exactPropertyListed:false},
    {authorization:'APPROVED'}
  ])assert.throws(()=>bind({preflight:{...preflight,...override},plan}),
    /SEO GSC binding:/);
});

test('binding refuses unknown extra query fields that could alter provider request',()=>{
  const preflight=review(scope([mk(requestedProperty)])),valid=planFor();
  const forbidden=[
    {...valid,body:{...valid.body,dimensionFilterGroups:[{filters:[]}]}},
    {...valid,body:{...valid.body,searchType:'image'}},
    {...valid,body:{...valid.body,aggregationType:'byProperty',dataState:'final',filters:[]}},
    {...valid,authorizationContext:{verified:true}},
    {...valid,body:{...valid.body,dimensions:['query','page']}}
  ];
  for(const plan of forbidden)
    assert.throws(()=>bind({preflight,plan}),/SEO GSC binding:/);
});
test('binding revalidates date windows rather than trusting a forged planner',()=>{
  const preflight=review(scope([mk(requestedProperty)])),valid=planFor();
  for(const [startDate,endDate] of [
    ['2026-02-30','2026-03-01'],
    ['2026-11-01','2026-10-01'],
    ['2026-01-01','2026-12-31'],
    ['', '2026-10-07']
  ])assert.throws(()=>bind({
    preflight,plan:{...valid,body:{...valid.body,startDate,endDate}}
  }),/SEO GSC binding: unsupported query period/);
});
test('preflight with declared property but zero inspected entries cannot bind',()=>{
  const original=review(scope([mk(requestedProperty)])),plan=planFor();
  assert.throws(()=>bind({preflight:{...original,propertiesInspected:0},plan}),
    /SEO GSC binding: valid offline preflight/);
});
test('valid strict query plan has exactly the expected readonly keys',()=>{
  const preflight=review(scope([mk(requestedProperty)]));
  const bound=bind({preflight,plan:planFor()});
  assert.equal(bound.authorization,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
  assert.equal(bound.productionReadAuthorized,false);
});
