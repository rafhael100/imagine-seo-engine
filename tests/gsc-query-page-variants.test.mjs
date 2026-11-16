import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineGscQueryPageOverlap as review}
  from '../src/gsc-query-page-overlap.mjs';
import {reviewOfflineGscQueryPagePagination as pages}
  from '../src/gsc-query-page-pagination.mjs';

const siteUrl='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl,
  propertyFingerprint:createHash('sha256').update(siteUrl).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:4};
const row=(term,url,clicks)=>({
  keys:[term,url],clicks,impressions:100,ctr:clicks/100,position:8
});
test('F64 redacts same-property URLs with query parameters and retains safe evidence',()=>{
  const result=review({rows:[
    row('crm','https://example.com/a',5),
    row('crm','https://example.com/personal?session=PERSON-SECRET-124',4),
    row('crm','https://www.example.com/b',3),
    row('email-person@example.com','https://example.com/c',2)
  ]},scope);
  assert.equal(result.summary.receivedRows,4);
  assert.equal(result.summary.redactedRows,2);
  assert.equal(result.summary.analyzedRows,2);
  assert.equal(result.summary.queriesOnMultiplePages,1);
  assert.equal(result.summary.impressionsOnOverlappingQueries,200);
  assert.equal(result.customerDisplayAuthorized,false);
  assert.doesNotMatch(JSON.stringify(result),
    /PERSON-SECRET-124|email-person@example\.com|\/personal|https:\/\/example.com\/a/);
});
test('F64 handles safe private URL variants across pagination boundaries',()=>{
  const result=pages([
    {startRow:0,rows:[
      row('seo','https://example.com/a',5),
      row('seo','https://example.com/private?token=VERY-PRIVATE-128',4)
    ]},
    {startRow:2,rows:[
      row('seo','https://example.com/b',3)
    ]}
  ],{...scope,rowLimit:2});
  assert.equal(result.summary.receivedRows,3);
  assert.equal(result.summary.redactedRows,1);
  assert.equal(result.summary.queriesOnMultiplePages,1);
  assert.equal(result.pagination.mayHaveMore,false);
  assert.doesNotMatch(JSON.stringify(result),/VERY-PRIVATE-128/);
});
test('F64 still rejects foreign-host variants and unsafe path aliases',()=>{
  for(const url of [
    'https://evil.invalid/a?token=123',
    'https://example.com.evil.invalid/a?token=123',
    'https://example.com/a/../b?token=123',
    'https://example.com/a%2fb?token=123',
    'https://example.com/a//b?token=123',
    'https://example.com:443/a?token=123',
    'http://example.com/a?token=123',
    'https://example.com/a#secret',
    'https://example.com/a?x=1#secret',
    'https://example.com/a?\u0000'
  ])assert.throws(()=>review({rows:[row('seo',url,1)]},scope),
    /invalid query\/page row/);
});
test('F64 URL-prefix property redacts only its own private query variants',()=>{
  const prefix='https://example.com/blog/';
  const local={...scope,siteUrl:prefix,
    propertyFingerprint:createHash('sha256').update(prefix).digest('hex')};
  const result=review({rows:[row('blog','https://example.com/blog/post?token=123',1)]},local);
  assert.equal(result.summary.redactedRows,1);
  assert.equal(result.summary.analyzedRows,0);
  assert.throws(()=>review({rows:[row('blog',
    'https://example.com/other/post?token=123',1)]},local),
    /invalid query\/page row/);
});
