import test from 'node:test';
import assert from 'node:assert/strict';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';
const period={startDate:'2026-10-01',endDate:'2026-10-07'};

test('imports standard English Search Console CSV and aggregates without raw queries',()=>{
  const csv='Top queries,Clicks,Impressions,CTR,Position\n'+
    '"landing pages para empresas",12,300,4%,8.5\n'+
    '"imagine comunicação",18,200,9%,1.8\n';
  const result=analyzeQueryExport(importGscQueriesCsv(csv,period));
  assert.equal(result.summary.clicks,30);
  assert.equal(result.summary.impressions,500);
  assert.equal(result.summary.analyzedRows,2);
  assert.doesNotMatch(JSON.stringify(result),/landing pages para empresas/);
});
test('parses Brazilian semicolon export, comma decimals and BOM',()=>{
  const csv='\uFEFFPrincipais consultas;Cliques;Impressões;CTR;Posição\n'+
    '"criação de sites";20;400;"5,0%";"9,5"\r\n'+
    '"google ads gestão";5;100;"5%";"7"\r\n';
  const result=analyzeQueryExport(importGscQueriesCsv(csv,period));
  assert.equal(result.summary.clicks,25);
  assert.equal(result.summary.impressions,500);
  assert.ok(result.clusters.some(x=>x.cluster==='criacao-de-sites'));
});
test('handles quoted commas and removes potentially identifying query rows from summaries',()=>{
  const csv='Queries,Clicks,Impressions,CTR,Position\n'+
    '"landing, páginas profissionais",4,100,4%,8\n'+
    '"pessoa@empresa.com",1,10,10%,3\n';
  const report=analyzeQueryExport(importGscQueriesCsv(csv,period));
  assert.equal(report.summary.redactedRows,1);
  assert.equal(report.summary.impressions,100);
  assert.doesNotMatch(JSON.stringify(report),/empresa.com/);
});
test('imported exports can be compared across two explicit equal periods',()=>{
  const before=importGscQueriesCsv('Queries,Clicks,Impressions,CTR,Position\n"landing pages",30,300,10%,8\n',period);
  const after=importGscQueriesCsv('Queries,Clicks,Impressions,CTR,Position\n"landing pages",10,180,"5,56%",11\n',
    {startDate:'2026-10-08',endDate:'2026-10-14'});
  const trend=compareGscPeriods(before,after);
  assert.equal(trend.summary.days,7);
  assert.ok(trend.summary.flaggedClusters>0);
});
test('rejects missing dates, unsupported page dimensions, malformed numeric fields and inconsistent CTR',()=>{
  const good='Queries,Clicks,Impressions,CTR,Position\nlanding pages,3,100,3%,8\n';
  assert.throws(()=>importGscQueriesCsv(good),/explicit startDate/);
  assert.throws(()=>importGscQueriesCsv('Pages,Clicks,Impressions,CTR,Position\nx,3,100,3%,8\n',period),/query header/);
  assert.throws(()=>importGscQueriesCsv(good.replace(',3,100,',',one,100,'),period),/invalid clicks/);
  assert.throws(()=>importGscQueriesCsv(good.replace('3%,8','90%,8'),period),/inconsistent metrics/);
  assert.throws(()=>importGscQueriesCsv(good.replace('3%,8','3%,bad'),period),/invalid position/);
});
test('rejects malformed quotes, unexpected columns and very large queries',()=>{
  assert.throws(()=>importGscQueriesCsv('Queries,Clicks,Impressions,CTR,Position\n"bad,3,100,3%,8\n',period),/unclosed quote/);
  assert.throws(()=>importGscQueriesCsv('Queries,Clicks,Impressions,CTR,Position,Device\nx,1,100,1%,8,desktop\n',period),/five unique/);
  const big='Queries,Clicks,Impressions,CTR,Position\n'+('a'.repeat(501))+',1,100,1%,8\n';
  assert.throws(()=>importGscQueriesCsv(big,period),/invalid query/);
});
