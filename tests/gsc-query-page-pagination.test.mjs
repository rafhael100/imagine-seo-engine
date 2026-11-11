import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineGscQueryPagePagination as analyze} from '../src/gsc-query-page-pagination.mjs';

const siteUrl='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl,
  propertyFingerprint:createHash('sha256').update(siteUrl).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:2};
const row=(q,p,c)=>({
  keys:[q,'https://www.example.com/'+p],
  clicks:c,impressions:100,ctr:c/100,position:8
});
const page=(startRow,rows)=>({startRow,rows,responseAggregationType:'byPage',metadata:{}});
const valid=()=>[
  page(0,[row('landings','one',5),row('sites','two',4)]),
  page(2,[row('landings','three',3)])
];
test('F59 detects query/page overlap across page boundary, without leaking source',()=>{
  const result=analyze(valid(),scope);
  assert.equal(result.contractVersion,'seo-gsc-query-page-pagination-offline-v2');
  assert.equal(result.pagination.pagesReceived,2);
  assert.equal(result.pagination.pageSize,2);
  assert.equal(result.pagination.lastPageRows,1);
  assert.equal(result.pagination.rowsReceived,3);
  assert.equal(result.pagination.mayHaveMore,false);
  assert.equal(result.pagination.nextStartRow,null);
  assert.equal(result.summary.distinctQueries,2);
  assert.equal(result.summary.queriesOnMultiplePages,1);
  assert.equal(result.summary.totalPagesAcrossOverlappingQueries,2);
  assert.equal(result.summary.impressionsOnOverlappingQueries,200);
  assert.equal(result.reviewStatus,'POSSIBLE_QUERY_PAGE_OVERLAP_REVIEW');
  assert.equal(result.productionReadAuthorized,false);
  assert.equal(result.networkPerformed,false);
  assert.doesNotMatch(JSON.stringify(result),/landings|https:\/\/www\.example\.com|\/three/);
});
test('F59 treats full final page as possible continuation, not complete evidence',()=>{
  const pages=[page(0,[row('sites','one',5),row('ads','two',4)])];
  const report=analyze(pages,scope);
  assert.equal(report.pagination.mayHaveMore,true);
  assert.equal(report.pagination.nextStartRow,2);
  assert.equal(report.pagination.pageSize,2);
  assert.equal(report.pagination.lastPageRows,2);
  assert.equal(report.summary.possibleTruncation,true);
  assert.equal(report.reviewStatus,'PARTIAL_COVERAGE_REVIEW_ONLY');
  assert.equal(report.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
});
test('F59 refuses skipped offsets and incomplete middle pages',()=>{
  for(const pages of [
    [page(1,[row('a','a',3)])],
    [page(0,[row('a','a',3)]),page(2,[row('b','b',2)])],
    [page(0,[row('a','a',3),row('b','b',2)]),page(3,[row('c','c',1)])],
    [page(0,[row('a','a',3)]),page(1,[row('b','b',2)])]
  ])assert.throws(()=>analyze(pages,scope),/invalid offset|intermediate page/);
});
test('F59 revalidates cross-page click ordering and duplicate pairs globally',()=>{
  const badOrder=[
    page(0,[row('a','a',5),row('b','b',4)]),
    page(2,[row('c','c',6)])
  ];
  const duplicated=[
    page(0,[row('a','a',5),row('b','b',4)]),
    page(2,[row('a','a',3)])
  ];
  assert.throws(()=>analyze(badOrder,scope),/invalid query\/page row/);
  assert.throws(()=>analyze(duplicated,scope),/duplicated query\/page pair/);
});
test('F59 rejects forged authorization and incomplete response metadata',()=>{
  const original=valid();
  const hidden={...original[0]};
  Object.defineProperty(hidden,'oauthVerified',{value:true});
  for(const pages of [
    [{...original[0],oauthVerified:true},original[1]],
    [hidden,original[1]],
    [{...original[0],metadata:{first_incomplete_date:null}},original[1]],
    [{...original[0],metadata:{providerConsent:true}},original[1]],
    [{...original[0],responseAggregationType:'byProperty'},original[1]]
  ])assert.throws(()=>analyze(pages,scope));
});
test('F59 bounds both number and size of pages',()=>{
  assert.throws(()=>analyze([],scope),/bounded pages/);
  assert.throws(()=>analyze(Array.from({length:5},()=>page(0,[])),scope),/bounded pages/);
  assert.throws(()=>analyze([page(0,[
    row('a','a',5),row('b','b',4),row('c','c',3)
  ])],scope),/invalid offset/);
  assert.throws(()=>analyze(valid(),{...scope,rowLimit:1001}),/invalid page size/);
});
test('F59 correctly handles four bounded pages, without treating batch as provider authentication',()=>{
  const pages=[
    page(0,[row('a','a',8),row('b','b',7)]),
    page(2,[row('c','c',6),row('a','d',5)]),
    page(4,[row('e','e',4),row('f','f',3)]),
    page(6,[row('g','g',2),row('h','h',1)])
  ];
  const result=analyze(pages,scope);
  assert.equal(result.pagination.maxPagesReached,true);
  assert.equal(result.pagination.pageSize,2);
  assert.equal(result.pagination.lastPageRows,2);
  assert.equal(result.pagination.mayHaveMore,true);
  assert.equal(result.pagination.nextStartRow,8);
  assert.equal(result.summary.queriesOnMultiplePages,1);
  assert.equal(result.customerDisplayAuthorized,false);
});
