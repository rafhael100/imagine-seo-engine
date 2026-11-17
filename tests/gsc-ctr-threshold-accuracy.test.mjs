import test from 'node:test';
import assert from 'node:assert/strict';
import {compareOfflineGscDailyPeriods}
  from '../src/gsc-daily-compare.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const metrics=(clicks,impressions)=>({clicks,impressions,
  ctr:impressions?clicks/impressions:0,position:impressions?5:null});
const dailyWindow=(date,clicks,impressions)=>({
  scope:{tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    startDate:date,endDate:date,rowLimit:92},
  response:{rows:[{keys:[date],...metrics(clicks,impressions)}]}
});
const queryWindow=(date,clicks,impressions)=>({
  dimensions:['query'],startDate:date,endDate:date,
  rows:[{keys:['seo'],...metrics(clicks,impressions),position:5}]
});
const dailyCompare=(before,after)=>compareOfflineGscDailyPeriods({
  previous:dailyWindow('2026-10-01',...before),
  current:dailyWindow('2026-10-02',...after)
});
const queryCompare=(before,after)=>compareGscPeriods(
  queryWindow('2026-10-01',...before),
  queryWindow('2026-10-02',...after)
);

const cases=[
  ['exactly two percentage points',[30,1000],[10,1000],true],
  ['less than two points before display rounding',[4001,100000],[2002,100000],false],
  ['more than two points',[4002,100000],[2001,100000],true],
  ['unchanged CTR',[30,1000],[60,2000],false],
  ['increased CTR',[10,1000],[30,1000],false],
  ['different denominators at the exact limit',[3,100],[7,700],true],
  ['counts beyond safe Number cross-products',
    [180000000000000,9000000000000000],
    [1,9000000000000000],false],
  ['existing minimum impression gate',[3,99],[0,99],false],
  ['zero previous impressions',[0,0],[10,1000],false],
  ['zero current impressions',[30,1000],[0,0],false]
];

for(const [name,before,after,expected] of cases){
  test('daily CTR threshold handles '+name,()=>{
    const output=dailyCompare(before,after);
    assert.equal(output.reviewSignals.includes('review_ctr_drop'),expected);
    assert.equal(output.productionReadAuthorized,false);
    assert.equal(output.customerDisplayAuthorized,false);
    assert.equal(output.networkPerformed,false);
  });
  test('query CTR threshold handles '+name,()=>{
    const output=queryCompare(before,after);
    assert.equal(output.changes[0].signals.includes('investigate_ctr_drop'),expected);
    assert.doesNotMatch(JSON.stringify(output),/BigInt/);
  });
}

test('daily partial date coverage still suppresses every review signal',()=>{
  const pair={previous:dailyWindow('2026-10-01',30,1000),
    current:dailyWindow('2026-10-02',10,1000)};
  pair.current.response.rows=[];
  const output=compareOfflineGscDailyPeriods(pair);
  assert.equal(output.coverageComplete,false);
  assert.deepEqual(output.reviewSignals,[]);
  assert.equal(output.change.ctrPercentagePoints,null);
});

test('CTR change rounds after subtracting unrounded ratios in both reports',()=>{
  const before=[40049,1000000],after=[20051,1000000];
  const daily=dailyCompare(before,after);
  const queries=queryCompare(before,after);
  assert.equal(daily.change.ctrPercentagePoints,-2);
  assert.equal(queries.changes[0].ctrChangePercentagePoints,-2);
  assert.equal(daily.previous.ctr,0.04);
  assert.equal(daily.current.ctr,0.0201);
});
