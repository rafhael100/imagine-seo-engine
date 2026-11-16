import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewGa4FunnelKeyEventReadiness as review}
  from '../src/ga4-funnel-measurement-readiness.mjs';

const input=events=>({
  sourceType:'operator_supplied_ga4_configuration_unverified',
  webStreamCount:1,keyEventNames:events
});
test('F130 detects a purchase-only setup does not measure lead generation',()=>{
  const result=review(input(['purchase']));
  assert.equal(result.methodology,'VISITAS_LEADS_CLIENTES');
  assert.equal(result.reviewStatus,'configuration_corrections_required');
  assert.equal(result.summary.reportedKeyEvents,1);
  assert.equal(result.summary.generateLeadKeyEventConfigured,false);
  assert.equal(result.summary.purchaseKeyEventConfigured,true);
  assert.ok(result.reviewSignals.includes('generate_lead_key_event_missing'));
  assert.ok(result.reviewSignals.includes(
    'purchase_not_authoritative_crm_customer_conversion'));
  assert.deepEqual(result.stages.map(x=>x.value),[null,null,null]);
  assert.deepEqual(Object.values(result.conversionRates),[null,null,null]);
  for(const flag of ['googlePropertyVerifiedInEngine','realEventDeliveryVerified',
    'privacyConsentVerified','crmTenantAuthorizationVerified',
    'customerConversionVerified','productionMetricsAuthorized',
    'customerDisplayAuthorized','networkPerformed'])
    assert.equal(result[flag],false,flag);
});
test('F130 generate_lead config is still not verified delivered or CRM-attributed',()=>{
  const result=review(input(['purchase','generate_lead']));
  assert.equal(result.reviewStatus,'independent_measurement_review_required');
  assert.equal(result.summary.generateLeadKeyEventConfigured,true);
  assert.equal(result.realEventDeliveryVerified,false);
  assert.equal(result.customerConversionVerified,false);
  assert.equal(result.customerDisplayAuthorized,false);
  assert.equal(result.stages[1].value,null);
});
test('F130 reports a site without a web stream but no fake visits',()=>{
  const result=review({...input(['generate_lead']),webStreamCount:0});
  assert.equal(result.reviewStatus,'configuration_corrections_required');
  assert.equal(result.summary.webStreamConfigured,false);
  assert.equal(result.stages[0].value,null);
});
test('F130 rejects PII, malformed event names, duplicates and unrequested authority',()=>{
  for(const args of [
    {...input(['purchase']),companyId:'private'},
    {...input(['purchase']),productionAuthorized:true},
    input(['generate_lead','generate_lead']),
    input(['person@example.com']),
    input(['lead generated']),
    input([123]),
    input(['constructor;DROP TABLE']),
    {...input([]),webStreamCount:Infinity},
    {...input([]),sourceType:'google_verified'}
  ])assert.throws(()=>review(args),/SEO F130/);
});
test('F130 rejects getter, symbol, sparse event arrays and inherited authority',()=>{
  const getter=input(['purchase']);
  Object.defineProperty(getter,'keyEventNames',{enumerable:true,
    get(){throw Error('PRIVATE');}});
  assert.throws(()=>review(getter),/SEO F130/);
  const sym=input([]);sym[Symbol('secret')]=true;
  assert.throws(()=>review(sym),/SEO F130/);
  const sparse=Array(2);sparse[0]='purchase';
  assert.throws(()=>review(input(sparse)),/SEO F130/);
  const inherited=Object.assign(Object.create({admin:true}),input([]));
  assert.throws(()=>review(inherited),/SEO F130/);
});
test('F130 bounded report does not echo custom event names or secrets',()=>{
  const result=review(input(['purchase','generate_lead','custom_private_tag']));
  assert.doesNotMatch(JSON.stringify(result),/custom_private_tag/);
  assert.equal(result.summary.reportedKeyEvents,3);
  assert.throws(()=>review(input(Array.from({length:101},(_,i)=>'event_'+i))),
    /SEO F130/);
});
