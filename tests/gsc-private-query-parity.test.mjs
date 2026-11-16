import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isSensitiveGscQuery} from '../src/gsc-private-query.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {reviewOfflineGscQueryPageOverlap}
  from '../src/gsc-query-page-overlap.mjs';

const pii=[
  '123.456.789-09',
  '12.345.678/0001-90',
  'pessoa@example.com',
  'telefone +55 (85) 99999-4444',
  'CPF: 12345678909'
];
const period={startDate:'2026-10-01',endDate:'2026-10-07'};
const row=(q,clicks=1,impressions=100)=>({
  keys:[q],clicks,impressions,
  ctr:clicks/impressions,position:8
});
const source=(entries)=>({
  dimensions:['query'],...period,rows:entries
});

test('F85 same shared filter recognizes Brazilian formatted CPF/CNPJ, email and phone',()=>{
  for(const q of pii)assert.equal(isSensitiveGscQuery(q),true,q);
  for(const q of ['landing pages profissionais','seo empresarial','sites por assinatura'])
    assert.equal(isSensitiveGscQuery(q),false,q);
  assert.equal(isSensitiveGscQuery(null),false);
});

test('F85 query-only JSON analytics drops formatted CPF and CNPJ before counters',()=>{
  const out=analyzeQueryExport(source([
    row(pii[0],1,100),
    row(pii[1],2,100),
    row('landing pages profissionais',4,200)
  ]));
  assert.equal(out.summary.inputRows,3);
  assert.equal(out.summary.redactedRows,2);
  assert.equal(out.summary.analyzedRows,1);
  assert.equal(out.summary.clicks,4);
  assert.equal(out.summary.impressions,200);
  assert.doesNotMatch(JSON.stringify(out),/123\.456|12\.345|pessoa@example/);
});

test('F85 CSV import uses the same privacy detection and never emits raw identifiers',()=>{
  const csv='Queries,Clicks,Impressions,CTR,Position\n'+
    '"'+pii[0]+'",1,100,1%,8\n'+
    '"'+pii[1]+'",2,100,2%,8\n'+
    '"sites por assinatura",5,100,5%,8\n';
  const out=analyzeQueryExport(importGscQueriesCsv(csv,period));
  assert.equal(out.summary.redactedRows,2);
  assert.equal(out.summary.clicks,5);
  assert.equal(out.summary.impressions,100);
  assert.doesNotMatch(JSON.stringify(out),/123\.456|12\.345/);
});

test('F85 query/page overlap and query-only analytics agree on redacted counts',()=>{
  const property='sc-domain:example.com';
  const scope={
    tenantRef:'imagine-demo',siteUrl:property,
    propertyFingerprint:createHash('sha256').update(property).digest('hex'),
    ...period,rowLimit:10
  };
  const entries=[
    {keys:[pii[0],'https://www.example.com/first'],clicks:4,
      impressions:100,ctr:0.04,position:8},
    {keys:[pii[1],'https://www.example.com/second'],clicks:3,
      impressions:100,ctr:0.03,position:8},
    {keys:['landing pages profissionais','https://www.example.com/third'],
      clicks:2,impressions:100,ctr:0.02,position:8}
  ];
  const gsc=reviewOfflineGscQueryPageOverlap({rows:entries},scope);
  assert.equal(gsc.summary.redactedRows,2);
  assert.equal(gsc.summary.analyzedRows,1);
  assert.equal(gsc.summary.distinctQueries,1);
  assert.equal(gsc.summary.impressionsOnOverlappingQueries,0);
  assert.equal(gsc.customerDisplayAuthorized,false);
  const single=analyzeQueryExport(source(entries.map(item=>({
    ...item,keys:[item.keys[0]]
  }))));
  assert.equal(single.summary.redactedRows,gsc.summary.redactedRows);
  assert.equal(single.summary.analyzedRows,gsc.summary.analyzedRows);
  assert.equal(single.summary.impressions,100);
  assert.doesNotMatch(JSON.stringify(gsc)+JSON.stringify(single),
    /123\.456\.789-09|12\.345\.678\/0001-90|https:\/\/www\.example\.com/);
});
