import test from 'node:test';
import assert from 'node:assert/strict';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';

const period={startDate:'2026-10-01',endDate:'2026-10-07'};

test('F84 uses only CR-delimited comma header, not semicolon in query row',()=>{
  const csv='Queries,Clicks,Impressions,CTR,Position\r'+
    '"landing; pages profissionais",5,100,5%,8\r'+
    '"site comercial",2,50,4%,10\r';
  const data=importGscQueriesCsv(csv,period);
  assert.equal(data.rows.length,2);
  const out=analyzeQueryExport(data);
  assert.equal(out.summary.clicks,7);
  assert.equal(out.summary.impressions,150);
  assert.doesNotMatch(JSON.stringify(out),/landing; pages profissionais|site comercial/);
});

test('F84 preserves semicolon PT-BR CSV with commas in private text under CR-only',()=>{
  const csv='\uFEFFConsultas;Cliques;Impressões;CTR;Posição\r'+
    '"serviços, sites";4;80;"5%";"8,5"\r'+
    '"pessoa@example.com";1;10;"10%";"3"\r';
  const report=analyzeQueryExport(importGscQueriesCsv(csv,period));
  assert.equal(report.summary.inputRows,2);
  assert.equal(report.summary.redactedRows,1);
  assert.equal(report.summary.impressions,80);
  assert.equal(report.summary.clicks,4);
  assert.doesNotMatch(JSON.stringify(report),/pessoa@example\.com|serviços, sites/);
});

test('F84 conventional CRLF and LF delimiters remain supported',()=>{
  for(const eol of ['\r\n','\n']){
    const csv='Queries,Clicks,Impressions,CTR,Position'+eol+
      '"sites; profissionais",10,200,5%,8'+eol;
    const parsed=importGscQueriesCsv(csv,period);
    assert.equal(parsed.rows.length,1);
    assert.equal(analyzeQueryExport(parsed).summary.clicks,10);
  }
});
