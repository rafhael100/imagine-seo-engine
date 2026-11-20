import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewOfflineGscQueryPageOverlap as review}
  from '../src/gsc-query-page-overlap.mjs';
import {reviewOfflineGscQueryPagePagination as paginate}
  from '../src/gsc-query-page-pagination.mjs';

const siteUrl='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl,
  propertyFingerprint:createHash('sha256').update(siteUrl).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:10};
const row=(query,path,clicks=10)=>({
  keys:[query,'https://example.com'+path],
  clicks,impressions:100,ctr:clicks/100,position:5
});

for(const [name,first,second] of [
  ['canonical Unicode','criação de sites','criação de sites'.normalize('NFD')],
  ['compatibility Unicode','seo','ｓｅｏ'],
  ['invisible format controls','seo','s\u200beo']
]){
  test('query/page overlap shares the existing '+name+' query identity',()=>{
    const output=review({rows:[row(first,'/a'),row(second,'/b')]},scope);
    assert.equal(output.summary.distinctQueries,1);
    assert.equal(output.summary.queriesOnMultiplePages,1);
    assert.equal(output.summary.totalPagesAcrossOverlappingQueries,2);
    assert.equal(output.summary.impressionsOnOverlappingQueries,200);
    assert.equal(output.reviewStatus,'POSSIBLE_QUERY_PAGE_OVERLAP_REVIEW');
    assert.equal(output.customerDisplayAuthorized,false);
    assert.equal(output.productionReadAuthorized,false);
    assert.equal(output.networkPerformed,false);
    assert.doesNotMatch(JSON.stringify(output),/example\.com|cria|ｓｅｏ|\u200b/);
  });

  test('query/page overlap refuses duplicate pairs disguised by '+name,()=>{
    assert.throws(()=>review({rows:[row(first,'/a'),row(second,'/a')]},scope),
      error=>error.message==='SEO GSC overlap: duplicated query/page pair');
  });
}

test('query/page identity preserves genuinely different accents and page paths',()=>{
  const output=review({rows:[
    row('criacao de sites','/a'),row('criação de sites','/a'),
    row('criação de sites','/b')
  ]},scope);
  assert.equal(output.summary.distinctQueries,2);
  assert.equal(output.summary.queriesOnMultiplePages,1);
  assert.equal(output.summary.impressionsOnOverlappingQueries,200);
});

test('query/page identity rejects a query made empty by invisible controls',()=>{
  assert.throws(()=>review({rows:[row('\u200b\u2060','/a')]},scope),
    error=>error.message==='SEO GSC overlap: invalid query');
});

test('paginated overlap refuses Unicode-equivalent duplicate pairs across pages',()=>{
  const first='criação de sites';
  const pages=[
    {startRow:0,rows:[row(first,'/a',10),row('landing pages','/b',9)]},
    {startRow:2,rows:[row(first.normalize('NFD'),'/a',8)]}
  ];
  assert.throws(()=>paginate(pages,{...scope,rowLimit:2}),
    error=>error.message==='SEO GSC overlap: duplicated query/page pair');
});

test('paginated overlap groups equivalent queries on different pages',()=>{
  const first='criação de sites';
  const pages=[
    {startRow:0,rows:[row(first,'/a',10),row('landing pages','/b',9)]},
    {startRow:2,rows:[row(first.normalize('NFD'),'/c',8)]}
  ];
  const output=paginate(pages,{...scope,rowLimit:2});
  assert.equal(output.summary.distinctQueries,2);
  assert.equal(output.summary.queriesOnMultiplePages,1);
  assert.equal(output.summary.impressionsOnOverlappingQueries,200);
  assert.equal(output.pagination.mayHaveMore,false);
  assert.equal(output.productionReadAuthorized,false);
});
