import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineGscQueryPageOverlap as review} from '../src/gsc-query-page-overlap.mjs';
import {reviewOfflineGscQueryPagePagination as pages} from '../src/gsc-query-page-pagination.mjs';
const siteUrl='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl,
  propertyFingerprint:createHash('sha256').update(siteUrl).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:1000};
const line=url=>({
  keys:['business seo',url],clicks:2,impressions:20,ctr:.1,position:8
});
test('F62 refuses URL aliases that WHATWG would silently rewrite',()=>{
  for(const url of [
    'https://example.com/a/../secret',
    'https://example.com/a/./secret',
    'https://example.com/a/%2E%2e/secret',
    'https://example.com/%2fsecret',
    'https://example.com/%5cprivate',
    'https://example.com/a//b',
    'https://example.com/a\\b',
    'https://example.com:443/a',
    'https://user@example.com/a',
    'https://example.com/a#token',
    'https://example.com',
    'https://example.com/a%zz'
  ]){
    assert.throws(()=>review({rows:[line(url)]},scope),
      /invalid query\/page row/,url);
    assert.throws(()=>pages([{startRow:0,rows:[line(url)]}],scope),
      /invalid query\/page row/,url);
  }
});
test('F62 accepts unambiguous within-domain full URLs including safe encoding',()=>{
  const rows=[
    line('https://example.com/'),
    line('https://www.example.com/servicos/criacao-de-sites/'),
    line('https://example.com/a%20b')
  ];
  const output=review({rows},scope);
  assert.equal(output.summary.receivedRows,3);
  assert.equal(output.summary.distinctQueries,1);
  assert.equal(output.summary.queriesOnMultiplePages,1);
  assert.equal(output.summary.totalPagesAcrossOverlappingQueries,3);
  assert.equal(output.productionReadAuthorized,false);
});
test('F62 never accepts subdomains of lookalike parent domains',()=>{
  for(const host of [
    'https://example.com.evil.invalid/a',
    'https://evil-example.com/a',
    'https://notexample.com/a'
  ])assert.throws(()=>review({rows:[line(host)]},scope),
    /invalid query\/page row/);
});
test('F62 preserves URL-prefix matching semantics without allowing foreign host',()=>{
  const prefix='https://example.com/blog/';
  const scoped={...scope,siteUrl:prefix,
    propertyFingerprint:createHash('sha256').update(prefix).digest('hex')};
  assert.equal(review({rows:[line('https://example.com/blog/post')]},scoped)
    .summary.receivedRows,1);
  assert.throws(()=>review({rows:[line('https://example.com/blogs/post')]},scoped),
    /invalid query\/page row/);
});
