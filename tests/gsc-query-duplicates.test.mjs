import test from 'node:test';
import assert from 'node:assert/strict';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const period={startDate:'2026-10-01',endDate:'2026-10-07'};
const next={startDate:'2026-10-08',endDate:'2026-10-14'};
const csvHeader='Queries,Clicks,Impressions,CTR,Position\n';
const make=(query,clicks,impressions)=>({
  keys:[query],clicks,impressions,
  ctr:clicks/impressions,position:8
});
const report=(window,rows)=>({
  dimensions:['query'],...window,rows
});
const privateTerm='PRIVATE-F83-PERSON@example.com';
const mustNotLeak=(fn,pattern)=>{
  assert.throws(fn,(e)=>{
    assert.match(e.message,pattern);
    assert.doesNotMatch(e.message,/PRIVATE-F83|@example\.com|https:\/\/|password|token/i);
    return true;
  });
};

test('F83 CSV importer refuses exact duplicate query before it inflates totals',()=>{
  const content=csvHeader+
    '"landing pages",5,100,5%,8\n'+
    '"landing pages",2,40,5%,8\n';
  mustNotLeak(()=>importGscQueriesCsv(content,period),/duplicate query row 3/);
});
test('F83 CSV importer refuses repeated personal query without exposing it',()=>{
  const content=csvHeader+
    '"'+privateTerm+'",1,10,10%,8\n'+
    '"'+privateTerm+'",1,20,5%,8\n';
  mustNotLeak(()=>importGscQueriesCsv(content,period),/duplicate query row 3/);
});
test('F83 JSON analyzer refuses duplicate public and private query rows',()=>{
  for(const q of ['landing pages',privateTerm]){
    mustNotLeak(()=>analyzeQueryExport(report(period,[
      make(q,2,100),make(q,1,30)
    ])),/duplicate query row 1/);
  }
});
test('F83 comparisons refuse duplicated rows in either period',()=>{
  const clean=report(period,[make('sites profissionais',5,100)]);
  const repeated=report(next,[
    make('landing pages',5,100),make('landing pages',2,40)
  ]);
  mustNotLeak(()=>compareGscPeriods(clean,repeated),/duplicate query row 1/);
  const old=report(period,[
    make(privateTerm,1,10),make(privateTerm,1,20)
  ]);
  mustNotLeak(()=>compareGscPeriods(old,report(next,[])),/duplicate query row 1/);
});
test('F83 different query strings in the same bucket remain additive',()=>{
  const csv=csvHeader+
    '"landing pages para empresas",5,100,5%,8\n'+
    '"landing page profissional",2,50,4%,9\n';
  const out=analyzeQueryExport(importGscQueriesCsv(csv,period));
  assert.equal(out.summary.inputRows,2);
  assert.equal(out.summary.impressions,150);
  assert.equal(out.summary.clicks,7);
  assert.equal(out.summary.redactedRows,0);
});
test('F83 exact comparison does not collapse distinct query spelling or cases',()=>{
  const csv=csvHeader+
    '"SEO",5,100,5%,8\n'+
    '"seo",2,50,4%,9\n';
  const out=importGscQueriesCsv(csv,period);
  assert.equal(out.rows.length,2);
  assert.equal(analyzeQueryExport(out).summary.impressions,150);
});
