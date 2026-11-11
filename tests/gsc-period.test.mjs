import test from 'node:test';
import assert from 'node:assert/strict';
import {gscDay,validateGscPeriod} from '../src/gsc-period.mjs';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';
const csv='Queries,Clicks,Impressions,CTR,Position\nlanding pages,3,100,3%,8\n';
const period={startDate:'2026-11-01',endDate:'2026-11-08'};
const sample=(startDate,endDate)=>({dimensions:['query'],startDate,endDate,rows:[]});
test('strict UTC Gregorian dates reject rolled-over days and impossible years',()=>{
  for(const date of ['2026-02-29','2026-04-31','2026-00-01','2026-13-01','2026-11-00','9999-99-99','2026-11-1']) {
    assert.throws(()=>gscDay(date),/invalid calendar date/);
    assert.throws(()=>importGscQueriesCsv(csv,{startDate:date,endDate:'2026-11-08'}),/invalid calendar date/);
    assert.throws(()=>analyzeQueryExport(sample(date,'2026-11-08')),/invalid reporting dates/);
  }
  assert.equal(validateGscPeriod('2024-02-29','2024-03-01').days,2);
});
test('CSV importer and analyzer reject reversed and oversized windows',()=>{
  for(const bad of [
    {startDate:'2026-11-08',endDate:'2026-11-01'},
    {startDate:'2026-01-01',endDate:'2026-11-01'}
  ]) {
    assert.throws(()=>importGscQueriesCsv(csv,bad),/reporting period/);
    assert.throws(()=>analyzeQueryExport(sample(bad.startDate,bad.endDate)),/invalid reporting dates/);
  }
  assert.equal(importGscQueriesCsv(csv,period).rows.length,1);
});
test('rejects counters whose sums exceed safe integer precision',()=>{
  const huge=Number.MAX_SAFE_INTEGER;
  const report={...sample(period.startDate,period.endDate),rows:[
    {keys:['site'],clicks:huge,impressions:huge,ctr:1,position:1},
    {keys:['landing page'],clicks:1,impressions:1,ctr:1,position:1}
  ]};
  assert.throws(()=>analyzeQueryExport(report),/counter overflow/);
});
