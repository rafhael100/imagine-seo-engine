import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareOfflineSeoFunnelPreview as preview}
  from '../src/seo-funnel-preview.mjs';

const property='sc-domain:example.com';
const row=(date,clicks,impressions)=>({
  keys:[date],clicks,impressions,
  ctr:impressions?clicks/impressions:0,
  position:impressions?8:null
});
const original=(startDate,endDate,rows)=>({
  tenantRef:'demo-tenant',expectedProperty:property,
  snapshot:{
    siteUrl:property,startDate,endDate,dimensions:['date'],
    rows,rowCount:rows.length,hasMore:false
  }
});
const previous=()=>original('2026-10-01','2026-10-02',[
  row('2026-10-01',8,80),row('2026-10-02',2,20)
]);
const current=()=>original('2026-10-03','2026-10-04',[
  row('2026-10-03',5,50),row('2026-10-04',5,50)
]);
const input=()=>({comparisonInput:{previous:previous(),current:current()}});

test('F106 renders methodology without converting GSC clicks into visits',()=>{
  const result=preview(input());
  assert.equal(result.contractVersion,'seo-visitas-leads-clientes-preview-offline-v1');
  assert.equal(result.methodology,'VISITAS_LEADS_CLIENTES');
  assert.deepEqual(result.stages.map(x=>x.name),['VISITAS','LEADS','CLIENTES']);
  assert.deepEqual(result.stages.map(x=>x.value),[null,null,null]);
  assert.deepEqual(Object.values(result.conversionRates),[null,null,null]);
  assert.equal(result.organicSearchDiscovery.clicks,10);
  assert.equal(result.organicSearchDiscovery.impressions,100);
  assert.equal(result.organicSearchDiscovery.clicksChangePercent,0);
  assert.equal(result.organicSearchDiscoveryStatus,'SUBMITTED_DATES_ONLY_ORIGIN_UNVERIFIED');
  for(const key of ['oauthVerifiedForImagine','portalTenantGrantVerified',
    'customerDisplayAuthorized','productionReadAuthorized',
    'publicationAuthorized','networkPerformed'])
    assert.equal(result[key],false,key);
  assert.deepEqual(result.reviewSignals,[]);
  assert.equal(result.releaseStatus,'HOLD_IMAGINE_BACKEND_AUTHORIZATION');
  assert.doesNotMatch(JSON.stringify(result),/example\.com|PRIVATE_SECRET/);
});

test('F106 withholds search totals when any input date was not submitted',()=>{
  const args=input();
  args.comparisonInput.previous.snapshot.rows.pop();
  args.comparisonInput.previous.snapshot.rowCount=1;
  const result=preview(args);
  assert.equal(result.organicSearchDiscovery,null);
  assert.equal(result.organicSearchDiscoveryStatus,'PARTIAL_DATES_WITHHELD');
  assert.deepEqual(result.stages.map(x=>x.value),[null,null,null]);
  assert.deepEqual(Object.values(result.conversionRates),[null,null,null]);
});

test('F106 never treats zero Search Console clicks as zero site visits',()=>{
  const args=input();
  const rows=args.comparisonInput.current.snapshot.rows;
  for(const r of rows){r.clicks=0;r.ctr=0;}
  const result=preview(args);
  assert.equal(result.organicSearchDiscovery.clicks,0);
  assert.equal(result.organicSearchDiscovery.clicksChangePercent,-100);
  assert.equal(result.stages[0].value,null);
  assert.equal(result.stages[1].value,null);
  assert.equal(result.stages[2].value,null);
});

test('F106 rejects caller-injected permissions, sources, and fabricated totals',()=>{
  assert.throws(()=>preview({...input(),customerDisplayAuthorized:true}),
    /original comparison input required/);
  assert.throws(()=>preview({...input(),visits:1234}),
    /original comparison input required/);
  assert.throws(()=>preview({...input(),leads:50,customers:2}),
    /original comparison input required/);
  const args=input();
  args.comparisonInput.current.snapshot.rows[0].leadCount=1;
  assert.throws(()=>preview(args),/invalid date-only row/);
  const dto=input();
  dto.comparisonInput.current={customerDisplayAuthorized:true};
  assert.throws(()=>preview(dto),/exact offline snapshot/);
});

test('F106 validates tenant and property independently, no attribution across accounts',()=>{
  const crossTenant=input();
  crossTenant.comparisonInput.current.tenantRef='other-tenant';
  assert.throws(()=>preview(crossTenant),/tenant or property mismatch/);
  const crossProperty=input();
  crossProperty.comparisonInput.current.expectedProperty='sc-domain:other.example';
  crossProperty.comparisonInput.current.snapshot.siteUrl='sc-domain:other.example';
  assert.throws(()=>preview(crossProperty),/tenant or property mismatch/);
});

test('F106 rejects accessor, hidden, prototype and symbolic outer fields',()=>{
  const accessor={};
  Object.defineProperty(accessor,'comparisonInput',{
    enumerable:true,get(){throw Error('PRIVATE_SECRET');}
  });
  assert.throws(()=>preview(accessor),/original comparison input required/);
  const hidden=input();
  Object.defineProperty(hidden,'privilege',{value:true});
  assert.throws(()=>preview(hidden),/original comparison input required/);
  const symbol=input();
  symbol[Symbol('permission')]=true;
  assert.throws(()=>preview(symbol),/original comparison input required/);
  const inherited=Object.assign(Object.create({customerDisplayAuthorized:true}),input());
  assert.throws(()=>preview(inherited),/original comparison input required/);
});
