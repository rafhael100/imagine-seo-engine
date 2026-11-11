import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';
const audit=(errors=[],warnings=[])=>({
  summary:{pages:3,errors:errors.length,warnings:warnings.length},
  routes:['/','/service/','/private/'],errors,warnings
});
const issue=(type,message='SECRET-USER-DATA')=>({type,file:'private/pessoa.html',message});
const row=(query,clicks,impressions)=>({
  keys:[query],clicks,impressions,ctr:impressions?clicks/impressions:0,position:8
});
test('clean offline audit creates a caveated report without imaginary rankings',()=>{
  const brief=buildOfflineSeoBrief({audit:audit()});
  assert.equal(brief.technical.status,'no_findings_in_supplied_audit');
  assert.equal(brief.organic,null);
  assert.deepEqual(brief.recommendedReviews,[]);
  assert.equal(brief.sourceType,'operator_supplied_offline_reports_unverified');
});
test('critical technical issues create fixed actions without exposing filenames or messages',()=>{
  const brief=buildOfflineSeoBrief({audit:audit([
    issue('unexpected_noindex'),issue('wrong_canonical')
  ],[issue('orphan_page')])});
  assert.deepEqual(brief.recommendedReviews.map(x=>x.code),[
    'repair_canonical','review_indexation','improve_internal_navigation'
  ]);
  assert.equal(brief.technical.errors,2);
  assert.doesNotMatch(JSON.stringify(brief),/SECRET-USER-DATA|private\/pessoa|service\//);
});
test('unknown issue types are transformed to a generic category',()=>{
  const brief=buildOfflineSeoBrief({audit:audit([issue('my_private_brand_SECRET-123')])});
  assert.equal(brief.recommendedReviews[0].code,'review_other_technical_findings');
  assert.doesNotMatch(JSON.stringify(brief),/SECRET-123/);
});
test('aggregates real offline trend contract without leaking search terms',()=>{
  const before={dimensions:['query'],startDate:'2026-10-01',endDate:'2026-10-07',
    rows:[row('landing pages SECRET',30,300),row('pessoa@empresa.com',1,10)]};
  const after={...before,startDate:'2026-10-08',endDate:'2026-10-14',
    rows:[row('landing pages SECRET',8,180),row('pessoa@empresa.com',1,10)]};
  const report=buildOfflineSeoBrief({audit:audit(),trend:compareGscPeriods(before,after)});
  assert.equal(report.organic.previous.clicks,30);
  assert.equal(report.organic.current.clicks,8);
  assert.equal(report.organic.clicksChangeFraction,-0.733);
  assert.ok(report.recommendedReviews.some(x=>x.code==='review_click_drop'));
  assert.doesNotMatch(JSON.stringify(report),/SECRET|pessoa@empresa|landing pages/);
});
test('refuses modified counts and incompatible trend data',()=>{
  assert.throws(()=>buildOfflineSeoBrief({audit:{...audit(),summary:{pages:3,errors:1,warnings:0}}}),
    /inconsistent audit counts/);
  assert.throws(()=>buildOfflineSeoBrief({audit:audit(),trend:{summary:{},changes:[]}}),
    /compatible offline trend/);
});
test('rejects unknown signal even if its key is a private query',()=>{
  const trend={dataSource:'two_user_provided_search_analytics_exports_not_verified',
    summary:{days:7,previous:{clicks:2,impressions:50},current:{clicks:1,impressions:30}},
    changes:[{cluster:'secret@example.com',signals:['secret@example.com']}]};
  assert.throws(()=>buildOfflineSeoBrief({audit:audit(),trend}),/unrecognized trend signal/);
});
test('deduplicates repeated trend signal per cluster and never includes cluster name',()=>{
  const trend={dataSource:'two_user_provided_search_analytics_exports_not_verified',
    summary:{days:7,previous:{clicks:10,impressions:100},current:{clicks:8,impressions:90}},
    changes:[{cluster:'SECRET',signals:['investigate_ctr_drop','investigate_ctr_drop']}]};
  const result=buildOfflineSeoBrief({audit:audit(),trend});
  assert.deepEqual(result.recommendedReviews,[{code:'review_ctr_drop',priority:'medium',count:1}]);
  assert.doesNotMatch(JSON.stringify(result),/SECRET/);
});
