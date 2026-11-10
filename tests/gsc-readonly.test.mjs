import test from 'node:test';
import assert from 'node:assert/strict';
import {planGscQuery,analyzeGscQueryResponse} from '../src/gsc-readonly.mjs';
const base={tenantRef:'imagine-demo',siteUrl:'https://example.com/',
  startDate:'2026-10-01',endDate:'2026-10-07',authorizationConfirmed:true};
const make=()=>planGscQuery(base);
test('plans official read-only POST with minimal web query and final data',()=>{
  const plan=make();
  assert.equal(plan.networkPerformed,false);
  assert.equal(plan.requiredOAuthScope,'https://www.googleapis.com/auth/webmasters.readonly');
  assert.equal(plan.method,'POST');
  assert.match(plan.url,/webmasters\/v3\/sites\/https%3A%2F%2Fexample.com%2F\/searchAnalytics\/query/);
  assert.deepEqual(plan.body.dimensions,['query']);
  assert.equal(plan.body.dataState,'final');
  assert.equal(plan.body.type,'web');
  assert.ok(!JSON.stringify(plan).includes('Bearer '));
});
test('supports declared domain properties without network requests',()=>{
  const plan=planGscQuery({...base,siteUrl:'sc-domain:example.com'});
  assert.match(plan.url,/sc-domain%3Aexample.com/);
  assert.match(plan.propertyFingerprint,/^[0-9a-f]{64}$/);
});
test('rejects missing declaration, unsafe properties and invalid windows',()=>{
  assert.throws(()=>planGscQuery({...base,authorizationConfirmed:false}),/operator declaration/);
  assert.throws(()=>planGscQuery({...base,siteUrl:'https://user:password@example.com/'}),/secure URL-prefix/);
  assert.throws(()=>planGscQuery({...base,siteUrl:'https://localhost/'}),/secure URL-prefix/);
  assert.throws(()=>planGscQuery({...base,startDate:'2026-02-30'}),/invalid calendar date/);
});
test('rejects excessive rowLimit and pagination offsets',()=>{
  assert.throws(()=>planGscQuery({...base,rowLimit:25001}),/rowLimit/);
  assert.throws(()=>planGscQuery({...base,rowLimit:0}),/rowLimit/);
  assert.throws(()=>planGscQuery({...base,startRow:-1}),/pagination/);
});
test('normalizes API-shaped response without exposing private search terms',()=>{
  const result=analyzeGscQueryResponse({rows:[
    {keys:['landing pages profissionais'],clicks:10,impressions:100,ctr:.1,position:8},
    {keys:['contato user@empresa.com'],clicks:1,impressions:10,ctr:.1,position:3}
  ]},make());
  assert.equal(result.summary.clicks,10);
  assert.equal(result.summary.redactedRows,1);
  assert.equal(result.pagination.mayHaveMore,false);
  assert.doesNotMatch(JSON.stringify(result),/landing pages profissionais|user@empresa.com|example.com/);
});
test('handles empty API responses without guessing totals or rankings',()=>{
  const report=analyzeGscQueryResponse({},make());
  assert.equal(report.summary.clicks,0);
  assert.deepEqual(report.clusters,[]);
});
test('rejects malformed response, excessive rows and inconsistent metrics',()=>{
  assert.throws(()=>analyzeGscQueryResponse({rows:null},make()),/invalid response/);
  assert.throws(()=>analyzeGscQueryResponse({rows:[
    {keys:['site'],clicks:2,impressions:1,ctr:1,position:3}
  ]},make()),/invalid metrics/);
  assert.throws(()=>analyzeGscQueryResponse({rows:[
    {keys:['site'],clicks:1,impressions:10,ctr:.1,position:3},
    {keys:['site'],clicks:1,impressions:10,ctr:.1,position:3}
  ]},planGscQuery({...base,rowLimit:1})),/rowLimit/);
});

test('rejects a response whose aggregation disagrees with requested property mode',()=>{
  assert.throws(()=>analyzeGscQueryResponse({
    rows:[],responseAggregationType:'byPage'
  },make()),/unexpected aggregation type/);
  assert.equal(analyzeGscQueryResponse({
    rows:[],responseAggregationType:'byProperty'
  },make()).summary.analyzedRows,0);
});
test('rejects incomplete response metadata despite final-data request',()=>{
  assert.throws(()=>analyzeGscQueryResponse({
    rows:[],metadata:{first_incomplete_date:'2026-10-07'}
  },make()),/incomplete metadata/);
});
test('refuses forged read-only plans with incompatible query dimensions or data state',()=>{
  const original=make();
  assert.throws(()=>analyzeGscQueryResponse({rows:[]},{
    ...original,body:{...original.body,dataState:'all'}
  }),/compatible query plan/);
  assert.throws(()=>analyzeGscQueryResponse({rows:[]},{
    ...original,body:{...original.body,dimensions:['page']}
  }),/compatible query plan/);
});

test('rejects duplicate query rows and out-of-order clicks in one API response',()=>{
  const row=(q,clicks)=>({keys:[q],clicks,impressions:100,ctr:clicks/100,position:8});
  assert.throws(()=>analyzeGscQueryResponse({rows:[row('site',10),row('site',10)]},make()),
    /duplicate query key/);
  assert.throws(()=>analyzeGscQueryResponse({rows:[row('site',5),row('seo',7)]},make()),
    /invalid query order/);
  const ok=analyzeGscQueryResponse({rows:[row('site',7),row('seo',7)]},make());
  assert.equal(ok.summary.analyzedRows,2);
});
test('refuses forged tenant, fingerprint and operator authorization fields',()=>{
  const plan=make(),response={rows:[]};
  assert.throws(()=>analyzeGscQueryResponse(response,{...plan,tenantRef:'bad private tenant'}),
    /compatible query plan/);
  assert.throws(()=>analyzeGscQueryResponse(response,{...plan,propertyFingerprint:'not-a-hash'}),
    /compatible query plan/);
  assert.throws(()=>analyzeGscQueryResponse(response,{...plan,authorization:'verified_provider'}),
    /compatible query plan/);
});
