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

test('response normalization rejects forged provider host and property target',()=>{
  const valid=make();
  for(const candidate of [
    {...valid,url:valid.url.replace('www.googleapis.com','malicious.example')},
    {...valid,url:valid.url.replace('example.com','unrelated.example')},
    {...valid,networkPerformed:true}
  ])assert.throws(()=>analyzeGscQueryResponse({rows:[]},candidate),
    /compatible query plan/);
});
test('response normalization rejects forged dates, extra request fields and scope',()=>{
  const valid=make();
  for(const candidate of [
    {...valid,body:{...valid.body,startDate:'2026-02-30'}},
    {...valid,body:{...valid.body,startDate:'2026-01-01',endDate:'2026-10-07'}},
    {...valid,body:{...valid.body,dimensionFilterGroups:[]}},
    {...valid,body:{...valid.body,searchType:'image'}},
    {...valid,requiredOAuthScope:'https://www.googleapis.com/auth/webmasters'},
    {...valid,pretendVerified:true}
  ])assert.throws(()=>analyzeGscQueryResponse({rows:[]},candidate),
    /compatible query plan/);
});
test('valid response remains offline, aggregated and privacy-safe',()=>{
  const valid=make();
  const result=analyzeGscQueryResponse({rows:[
    {keys:['servicos imagine'],clicks:4,impressions:40,ctr:0.1,position:5}
  ]},valid);
  assert.equal(result.sourceType,'operator_supplied_api_shaped_response_not_verified');
  assert.equal(result.summary.analyzedRows,1);
  assert.doesNotMatch(JSON.stringify(result),/servicos imagine|example.com/);
});

test('F44 rejects unknown response and row fields in offline GSC payloads',()=>{
  const valid={keys:['seo audit'],clicks:2,impressions:20,ctr:.1,position:4};
  for(const response of [
    {rows:[valid],oauthVerified:true},
    {rows:[valid],tenantRef:'other-tenant'},
    {rows:[{...valid,authorization:'APPROVED'}]},
    {rows:[{...valid,experimentalMetric:1}]},
    {rows:[{keys:['seo audit'],clicks:2,impressions:20,ctr:.1}]}
  ])assert.throws(()=>analyzeGscQueryResponse(response,make()),
    /SEO GSC response: invalid response|SEO GSC response: invalid query order or key/);
  assert.equal(analyzeGscQueryResponse({rows:[valid]},make()).summary.analyzedRows,1);
});

test('F45 rejects unknown and falsy incomplete metadata markers',()=>{
  for(const metadata of [
    {first_incomplete_date:null},
    {first_incomplete_date:''},
    {first_incomplete_hour:0},
    {first_incomplete_hour:false},
    {oauthVerified:true},
    {tenantRef:'other'},
    [],
    null
  ])assert.throws(()=>analyzeGscQueryResponse({rows:[],metadata},make()),
    /unexpected or incomplete metadata/);
  assert.equal(analyzeGscQueryResponse({rows:[],metadata:{}},make()).summary.analyzedRows,0);
});

test('F46 planner rejects unknown input properties and forged authorization hints',()=>{
  const valid=make();
  for(const unsafe of [
    {...base,oauthVerified:true},
    {...base,networkPerformed:true},
    {...base,tenantGrant:'admin'},
    {...base,scope:'https://www.googleapis.com/auth/webmasters'},
    {...base,dimensionFilterGroups:[]},
    {...base,searchType:'image'},
    {...base,siteUrl:'https://example.com/',extra:undefined},
    null,[], 'not-an-object'
  ])assert.throws(()=>planGscQuery(unsafe),/unsupported planner input/);
  assert.equal(planGscQuery({...base,rowLimit:25,startRow:1}).body.rowLimit,25);
  assert.equal(valid.networkPerformed,false);
});

test('F47 planner rejects inherited fields, getters and hidden keys',()=>{
  const inherited=Object.create({...base});
  const getter={...base};
  Object.defineProperty(getter,'authorizationConfirmed',{enumerable:true,get(){
    throw Error('sensitive getter must not execute');
  }});
  const hidden={...base};
  Object.defineProperty(hidden,'oauthVerified',{value:true,enumerable:false});
  const symbol={...base,[Symbol('operatorGrant')]:true};
  const special=Object.create({unknown:true});
  Object.assign(special,base);
  for(const unsafe of [inherited,getter,hidden,symbol,special])
    assert.throws(()=>planGscQuery(unsafe),/unsupported planner input/);
  const nullProto=Object.assign(Object.create(null),base);
  assert.equal(planGscQuery(nullProto).networkPerformed,false);
});
