import test from 'node:test';
import assert from 'node:assert/strict';
import {planGscQuery} from '../src/gsc-readonly.mjs';
import {analyzeGscPaginatedResponses} from '../src/gsc-pagination.mjs';
const config={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:2};
const plan=()=>planGscQuery(config);
const row=(query,clicks=10,impressions=100)=>({
  keys:[query],clicks,impressions,ctr:clicks/impressions,position:8
});
test('assembles ordered pages and redacts private queries from final report',()=>{
  const out=analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('landing page profissional'),row('google ads gestão')]},
    {startRow:2,rows:[row('pessoa@empresa.com'),row('seo para empresas')]},
    {startRow:4,rows:[]}
  ],plan());
  assert.equal(out.summary.redactedRows,1);
  assert.equal(out.summary.analyzedRows,3);
  assert.equal(out.pagination.pagesReceived,3);
  assert.equal(out.pagination.mayHaveMore,false);
  assert.doesNotMatch(JSON.stringify(out),/pessoa@empresa.com|landing page profissional/);
});
test('blocks duplicated queries across response boundaries',()=>{
  assert.throws(()=>analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('site'),row('seo')]},
    {startRow:2,rows:[row('site')]}
  ],plan()),/duplicated query/);
});
test('blocks out-of-order offsets and truncated intermediate pages',()=>{
  assert.throws(()=>analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('site'),row('seo')]},
    {startRow:3,rows:[]}
  ],plan()),/invalid page order/);
  assert.throws(()=>analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('site')]},
    {startRow:2,rows:[]}
  ],plan()),/incomplete intermediate/);
});
test('reports uncertainty when last provided page is full',()=>{
  const out=analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('site'),row('seo')]}
  ],plan());
  assert.equal(out.pagination.mayHaveMore,true);
  assert.equal(out.pagination.sourceMayBeTruncated,true);
});
test('applies bounded limits to number of pages and total rows',()=>{
  const items=[
    {startRow:0,rows:[row('site'),row('seo')]},
    {startRow:2,rows:[row('onepage'),row('landing page')]}
  ];
  assert.throws(()=>analyzeGscPaginatedResponses(items,plan(),{maxPages:1}),/too many response/);
  assert.throws(()=>analyzeGscPaginatedResponses(items,plan(),{maxRows:3}),/safety cap/);
  assert.throws(()=>analyzeGscPaginatedResponses(items,plan(),{maxRows:100000}),/invalid safety limits/);
});
test('rejects malformed supplied responses and nonzero starting offset',()=>{
  assert.throws(()=>analyzeGscPaginatedResponses([],plan()),/at least one page/);
  assert.throws(()=>analyzeGscPaginatedResponses([{startRow:0,rows:null}],plan()),/invalid page/);
  assert.throws(()=>analyzeGscPaginatedResponses([{startRow:2,rows:[]}],
    planGscQuery({...config,startRow:2})),/start at zero/);
});

test('rejects pagination that violates descending clicks order',()=>{
  assert.throws(()=>analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('primeiro',30),row('segundo',20)]},
    {startRow:2,rows:[row('terceiro',25)]}
  ],plan()),/click order/);
});
test('rejects mixed aggregation and incomplete provider metadata across pages',()=>{
  assert.throws(()=>analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('site'),row('seo')],responseAggregationType:'byPage'}
  ],plan()),/aggregation type/);
  assert.throws(()=>analyzeGscPaginatedResponses([
    {startRow:0,rows:[row('site'),row('seo')],
      metadata:{first_incomplete_date:'2026-10-01'}}
  ],plan()),/incomplete metadata/);
});

test('F48 rejects forged pagination fields, row grants and incomplete metadata markers',()=>{
  const valid=row('seo');
  for(const supplied of [
    {startRow:0,rows:[valid],oauthVerified:true},
    {startRow:0,rows:[valid],tenantRef:'another'},
    {startRow:0,rows:[{...valid,authorization:'APPROVED'}]},
    {startRow:0,rows:[{...valid,position:undefined}]},
    {startRow:0,rows:[valid],metadata:{first_incomplete_date:null}},
    {startRow:0,rows:[valid],metadata:{first_incomplete_hour:false}},
    {startRow:0,rows:[valid],metadata:{oauthVerified:true}}
  ])assert.throws(()=>analyzeGscPaginatedResponses([supplied],plan()),
    /invalid page|expected one query key|metadata|invalid metrics/);
  assert.equal(analyzeGscPaginatedResponses([
    {startRow:0,rows:[valid],metadata:{}}
  ],plan()).pagination.rowsReceived,1);
});
test('F48 rejects hidden and inherited pagination metadata',()=>{
  const hidden={startRow:0,rows:[row('seo')]};
  Object.defineProperty(hidden,'oauthVerified',{value:true});
  const inherited=Object.assign(Object.create({oauthVerified:true}),{
    startRow:0,rows:[row('seo')]
  });
  const getter={startRow:0,rows:[row('seo')]};
  Object.defineProperty(getter,'metadata',{enumerable:true,get(){
    throw Error('untrusted accessor must not run');
  }});
  for(const supplied of [hidden,inherited,getter])
    assert.throws(()=>analyzeGscPaginatedResponses([supplied],plan()),/invalid page/);
});
