import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeQueryExport } from '../src/opportunities.mjs';

function report(rows=[]) {
  return {dimensions:['query'],startDate:'2026-11-01',endDate:'2026-11-08',rows};
}
const make=(q,clicks,impressions,position)=>({
  keys:[q],clicks,impressions,ctr:impressions?clicks/impressions:0,position
});
test('summarizes commercial nonbranded clusters without leaking raw queries',()=>{
  const r=analyzeQueryExport(report([
    make('criação de landing page para empresas',15,600,8.5),
    make('imagine landing page',10,100,1.5),
    make('gestão google ads',2,300,15)
  ]));
  assert.equal(r.summary.clicks,27);
  assert.equal(r.summary.impressions,1000);
  assert.equal(r.clusters.find(x=>x.cluster==='landing-pages' && x.segment==='nonbranded').opportunity,'review_content_and_ctr');
  assert.equal(r.clusters.find(x=>x.segment==='branded').opportunity,null);
  assert.doesNotMatch(JSON.stringify(r),/criação de landing page para empresas/);
  assert.deepEqual(r.period,{startDate:'2026-11-01',endDate:'2026-11-08'});
});
test('removes possible personal information and does not preserve queries in output',()=>{
  const r=analyzeQueryExport(report([
    make('contato pessoa@empresa.com',1,5,3),
    make('telefone +55 85 99999 4444',1,3,2),
    make('site por assinatura',5,150,9)
  ]));
  assert.equal(r.summary.redactedRows,2);
  assert.equal(r.summary.impressions,150);
  assert.equal(r.clusters[0].cluster,'sites-por-assinatura');
  assert.ok(!JSON.stringify(r).includes('empresa.com'));
});
test('rejects wrong dimensions, malformed rows and implausible CTR',()=>{
  assert.throws(()=>analyzeQueryExport({...report(),dimensions:['page']}),/only dimension/);
  assert.throws(()=>analyzeQueryExport(report([make('site',10,3,4)])),/invalid metrics/);
  assert.throws(()=>analyzeQueryExport(report([{keys:['site'],clicks:1,impressions:100,ctr:0.9,position:8}])),/inconsistent CTR/);
  assert.throws(()=>analyzeQueryExport(report([{keys:['site'],clicks:0,impressions:10,ctr:0,position:NaN}])),/invalid metrics/);
});
test('handles no rows and does not invent metrics or rankings',()=>{
  const r=analyzeQueryExport(report());
  assert.equal(r.summary.analyzedRows,0);
  assert.equal(r.summary.ctr,0);
  assert.deepEqual(r.clusters,[]);
  assert.ok(r.limitations.some(x=>x.includes('average')));
});
test('requires dates and a positive opportunity threshold',()=>{
  assert.throws(()=>analyzeQueryExport({...report(),endDate:'bad'}),/invalid reporting dates/);
  assert.throws(()=>analyzeQueryExport(report(),{minImpressions:0}),/minimum impressions/);
});

test('refuses zero-impression rows with nonzero CTR rather than reporting inconsistent metrics',()=>{
  assert.throws(()=>analyzeQueryExport(report([
    {keys:['seo'],clicks:0,impressions:0,ctr:0.9,position:1}
  ])),/inconsistent CTR/);
  assert.equal(analyzeQueryExport(report([
    {keys:['seo'],clicks:0,impressions:0,ctr:0,position:1}
  ])).summary.analyzedRows,1);
});
test('minimum-impression threshold must be an integer safe to compare',()=>{
  assert.throws(()=>analyzeQueryExport(report(),{minImpressions:Number.MAX_SAFE_INTEGER+1}),/minimum impressions/);
});
