import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isStrictDataArray} from '../src/gsc-strict-arrays.mjs';
import {reviewOfflineGscQueryPageOverlap} from '../src/gsc-query-page-overlap.mjs';
import {reviewOfflineGscQueryPagePagination} from '../src/gsc-query-page-pagination.mjs';

const siteUrl='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl,
  propertyFingerprint:createHash('sha256').update(siteUrl).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:2};
const row=(query='seo',path='a',clicks=2)=>({
  keys:[query,'https://example.com/'+path],
  clicks,impressions:100,ctr:clicks/100,position:8
});
test('F61 accepts ordinary dense JSON-style data arrays',()=>{
  assert.equal(isStrictDataArray([]),true);
  assert.equal(isStrictDataArray([1,2,3],3),true);
  const response=reviewOfflineGscQueryPageOverlap({rows:[row()]},scope);
  assert.equal(response.summary.analyzedRows,1);
  const paged=reviewOfflineGscQueryPagePagination([
    {startRow:0,rows:[row('seo','a',5)]}
  ],scope);
  assert.equal(paged.summary.analyzedRows,1);
});
test('F61 rejects hidden keys, inherited arrays, symbols and sparse slots',()=>{
  const hidden=[row()];
  Object.defineProperty(hidden,'authorization',{value:true});
  const inherited=[row()];
  Object.setPrototypeOf(inherited,[]);
  const symbols=[row()];
  symbols[Symbol('oauthVerified')]=true;
  const sparse=new Array(1);
  for(const unsafe of [hidden,inherited,symbols,sparse]){
    assert.equal(isStrictDataArray(unsafe),false);
    assert.throws(()=>reviewOfflineGscQueryPageOverlap({rows:unsafe},scope),/unsupported input/);
  }
});
test('F61 rejects getters on response rows without running them',()=>{
  let called=0;
  const rows=[row()];
  Object.defineProperty(rows,'0',{enumerable:true,configurable:true,get(){
    called++;throw Error('getter should not execute');
  }});
  assert.throws(()=>reviewOfflineGscQueryPageOverlap({rows},scope),/unsupported input/);
  assert.equal(called,0);
});
test('F61 rejects getters on query/page keys without evaluating the accessor',()=>{
  let called=0;
  const entry=row();
  Object.defineProperty(entry.keys,'0',{configurable:true,enumerable:true,get(){
    called++;throw Error('private getter should not run');
  }});
  assert.throws(()=>reviewOfflineGscQueryPageOverlap({rows:[entry]},scope),/invalid query\/page row/);
  assert.equal(called,0);
});
test('F61 rejects hostile pagination list and page rows without invoking accessors',()=>{
  let called=0;
  const list=[{startRow:0,rows:[row()]}];
  Object.defineProperty(list,'0',{configurable:true,enumerable:true,get(){
    called++;throw Error('page getter should not execute');
  }});
  assert.throws(()=>reviewOfflineGscQueryPagePagination(list,scope),/bounded pages/);
  const values=[row()];
  Object.defineProperty(values,'0',{configurable:true,enumerable:true,get(){
    called++;throw Error('row getter should not execute');
  }});
  assert.throws(()=>reviewOfflineGscQueryPagePagination([
    {startRow:0,rows:values}
  ],scope),/invalid offset or response/);
  assert.equal(called,0);
});
test('F61 rejects mutated iterator on query/page keys',()=>{
  const entry=row();
  Object.defineProperty(entry.keys,Symbol.iterator,{value:()=>[]});
  assert.throws(()=>reviewOfflineGscQueryPageOverlap({rows:[entry]},scope),/invalid query\/page row/);
});
