import test from 'node:test';
import assert from 'node:assert/strict';
import {hasImpressionDropAboveThirtyPercent,hasClickDropAboveTwentyFivePercent}
 from '../src/gsc-signal-thresholds.mjs';
import {compareOfflineGscDailyPeriods} from '../src/gsc-daily-compare.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const metrics=(clicks,impressions)=>({
 clicks,impressions,ctr:impressions?clicks/impressions:0,
 position:impressions?5:null
});
const daily=(date,clicks,impressions)=>({
 scope:{tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
  startDate:date,endDate:date,rowLimit:92},
 response:{rows:[{keys:[date],...metrics(clicks,impressions)}]}
});
const query=(date,clicks,impressions)=>({
 dimensions:['query'],startDate:date,endDate:date,
 rows:[{keys:['seo'],...metrics(clicks,impressions),position:5}]
});
function compareBoth(before,after){
 const dates=['2026-10-01','2026-10-02'];
 const d=compareOfflineGscDailyPeriods({
  previous:daily(dates[0],...before),current:daily(dates[1],...after)
 });
 const q=compareGscPeriods(query(dates[0],...before),query(dates[1],...after));
 return [d.reviewSignals,q.changes[0].signals];
}

test('F214: mathematically exact thresholds, with boundary never flagged',()=>{
 assert.equal(hasImpressionDropAboveThirtyPercent(1000,700),false);
 assert.equal(hasImpressionDropAboveThirtyPercent(1000,699),true);
 assert.equal(hasClickDropAboveTwentyFivePercent(1000,750),false);
 assert.equal(hasClickDropAboveTwentyFivePercent(1000,749),true);
 for(const value of [-1,1.25,NaN,Infinity,'100',null,Number.MAX_SAFE_INTEGER+1]){
  assert.throws(()=>hasImpressionDropAboveThirtyPercent(value,1));
  assert.throws(()=>hasClickDropAboveTwentyFivePercent(10,value));
 }
});

test('F214: prevent lost impressions alerts caused by imprecise .7 multiplication',()=>{
 // Both values are safe integers, but 0.7 * previous rounds upward:
 // the former Number comparison silently missed this strict drop.
 const before=9007199254740791,after=6305039478318553;
 assert.equal(after<before*.7,false,'Reproduce old false-negative');
 assert.equal(BigInt(after)*10n<BigInt(before)*7n,true);
 for(const [dailySignals,querySignals] of [compareBoth([0,before],[0,after])]){
  assert.ok(dailySignals.includes('review_impression_drop'));
  assert.ok(querySignals.includes('investigate_impressions_drop'));
 }
});

test('F214: prevent lost clicks alerts caused by imprecise .75 multiplication',()=>{
 const before=9007199254740502,after=6755399441055376;
 assert.equal(after<before*.75,false,'Reproduce old false-negative');
 assert.equal(BigInt(after)*4n<BigInt(before)*3n,true);
 const [dailySignals,querySignals]=compareBoth([before,before],[after,before]);
 assert.ok(dailySignals.includes('review_click_drop'));
 assert.ok(querySignals.includes('investigate_clicks_drop'));
});

test('F214: both offline workflows preserve strict equality at policy thresholds',()=>{
 const [dailySignals,querySignals]=compareBoth([100,1000],[75,700]);
 assert.ok(!dailySignals.includes('review_impression_drop'));
 assert.ok(!dailySignals.includes('review_click_drop'));
 assert.ok(!querySignals.includes('investigate_impressions_drop'));
 assert.ok(!querySignals.includes('investigate_clicks_drop'));
});
