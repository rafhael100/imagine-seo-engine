import test from 'node:test';
import assert from 'node:assert/strict';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const make=(query,clicks,impressions,position)=>({
  keys:[query],clicks,impressions,ctr:impressions?clicks/impressions:0,position
});
const report=(startDate,endDate,rows=[])=>({
  dimensions:['query'],startDate,endDate,rows
});
const prev=rows=>report('2026-10-19','2026-10-25',rows);
const curr=rows=>report('2026-10-26','2026-11-01',rows);

test('identifies substantive changes in nonbranded organic search demand',()=>{
  const result=compareGscPeriods(prev([
    make('criação de sites para empresas',40,500,7),
    make('imagine comunicação',30,400,1.5)
  ]),curr([
    make('criação de sites para empresas',10,240,11),
    make('imagine comunicação',32,420,1.4)
  ]));
  const row=result.changes.find(x=>x.cluster==='criacao-de-sites'&&x.segment==='nonbranded');
  assert.deepEqual(row.signals.sort(),[
    'investigate_impressions_drop','investigate_clicks_drop',
    'investigate_ctr_drop','investigate_average_position_decline'
  ].sort());
  assert.equal(result.summary.days,7);
  assert.ok(result.summary.flaggedClusters>=1);
  assert.doesNotMatch(JSON.stringify(result),/criação de sites para empresas/);
});
test('empty reports have no fabricated ranking or divide-by-zero change',()=>{
  const result=compareGscPeriods(prev([]),curr([]));
  assert.deepEqual(result.changes,[]);
  assert.equal(result.summary.clicksChangePct,null);
  assert.equal(result.summary.impressionsChangePct,null);
});
test('requires chronologically ordered non-overlapping equal duration periods',()=>{
  assert.throws(()=>compareGscPeriods(
    prev([]),report('2026-10-26','2026-10-30',[])
  ),/equal windows/);
  assert.throws(()=>compareGscPeriods(
    prev([]),report('2026-10-24','2026-10-30',[])
  ),/without overlap/);
});
test('avoids strong decline conclusions from small samples',()=>{
  const result=compareGscPeriods(prev([make('seo empresarial',1,15,12)]),
    curr([make('seo empresarial',0,1,20)]));
  assert.deepEqual(result.changes[0].signals,[]);
});
test('separates brand from commercial nonbrand and flags new visible cluster',()=>{
  const result=compareGscPeriods(prev([make('imagine sites',20,200,1)]),
    curr([
      make('imagine sites',20,200,1),
      make('landing pages profissionais',8,180,10)
    ]));
  const novelty=result.changes.find(x=>x.cluster==='landing-pages');
  assert.ok(novelty.signals.includes('new_visible_cluster'));
  assert.equal(result.changes.find(x=>x.segment==='branded').signals.length,0);
});
test('does not expose raw emails or phone numbers from sensitive queries',()=>{
  const result=compareGscPeriods(
    prev([make('telefone pessoa@empresa.com',2,10,2)]),
    curr([make('telefone +55 85 99999 4444',3,10,2)])
  );
  assert.equal(result.summary.redactedRows,2);
  assert.equal(result.summary.current.impressions,0);
  assert.doesNotMatch(JSON.stringify(result),/empresa.com|99999/);
});
test('rejects impossible calendar dates and invalid Search Console dimensions',()=>{
  assert.throws(()=>compareGscPeriods(
    report('2026-02-30','2026-03-07',[]),
    report('2026-03-08','2026-03-14',[])
  ),/invalid calendar date|invalid reporting dates|equal windows/);
  assert.throws(()=>compareGscPeriods(
    {...prev([]),dimensions:['page']},curr([])
  ),/only dimension/);
});
