import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';
import {preparePortalSeoHandoff} from '../src/portal-handoff.mjs';
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
    rows:[row('landing pages SECRET',30,300)]};
  const after={...before,startDate:'2026-10-08',endDate:'2026-10-14',
    rows:[row('landing pages SECRET',8,180)]};
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
    summary:{days:7,redactedRows:0,previous:{clicks:2,impressions:50},current:{clicks:1,impressions:30}},
    changes:[{cluster:'secret@example.com',signals:['secret@example.com']}]};
  assert.throws(()=>buildOfflineSeoBrief({audit:audit(),trend}),/unrecognized trend signal/);
});
test('deduplicates repeated trend signal per cluster and never includes cluster name',()=>{
  const trend={dataSource:'two_user_provided_search_analytics_exports_not_verified',
    summary:{days:7,redactedRows:0,previous:{clicks:10,impressions:100},current:{clicks:8,impressions:90}},
    changes:[{cluster:'SECRET',signals:['investigate_ctr_drop','investigate_ctr_drop']}]};
  const result=buildOfflineSeoBrief({audit:audit(),trend});
  assert.deepEqual(result.recommendedReviews,[{code:'review_ctr_drop',priority:'medium',count:1}]);
  assert.doesNotMatch(JSON.stringify(result),/SECRET/);
});


test('F87 redacted GSC rows suppress ALL organic totals and signals in executive brief and Portal handoff',()=>{
  const before={
    dimensions:['query'],startDate:'2026-10-01',endDate:'2026-10-07',
    rows:[row('landing pages PRIVATE-F87',30,300),
      row('pessoa@example.com',1,10)]
  };
  const after={
    ...before,startDate:'2026-10-08',endDate:'2026-10-14',
    rows:[row('landing pages PRIVATE-F87',8,180),
      row('pessoa@example.com',1,10)]
  };
  const trend=compareGscPeriods(before,after);
  assert.equal(trend.summary.redactedRows,2);
  assert.ok(trend.changes.some(x=>x.signals.length>0),
    'Fixture must contain a tempting but unsafe organic recommendation');
  const brief=buildOfflineSeoBrief({
    audit:audit([issue('wrong_canonical')]),
    trend
  });
  assert.equal(brief.organic,null);
  assert.deepEqual(brief.recommendedReviews.map(x=>x.code),['repair_canonical']);
  assert.ok(brief.limitations.some(x=>x.includes('withheld')));
  assert.doesNotMatch(JSON.stringify(brief),/pessoa@example|PRIVATE-F87/);
  const handoff=preparePortalSeoHandoff({
    tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    sourceRevision:'b'.repeat(40),brief
  });
  assert.equal(handoff.organic,null);
  assert.deepEqual(handoff.suggestedReviews.map(x=>x.code),['repair_canonical']);
  assert.equal(handoff.customerDisplayAuthorized,false);
  assert.equal(handoff.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  assert.doesNotMatch(JSON.stringify(handoff),/pessoa@example|PRIVATE-F87/);
});

test('F87 requires bounded integer redaction counts before organic brief can be emitted',()=>{
  const base={
    dataSource:'two_user_provided_search_analytics_exports_not_verified',
    summary:{days:7,redactedRows:0,
      previous:{clicks:30,impressions:300},
      current:{clicks:10,impressions:180}},
    changes:[{signals:['investigate_clicks_drop']}]
  };
  for(const redactedRows of [undefined,-1,0.5,NaN,Infinity,200001,'0']){
    assert.throws(()=>buildOfflineSeoBrief({
      audit:audit(),
      trend:{...base,summary:{...base.summary,redactedRows}}
    }),/invalid trend summary/);
  }
  const okay=buildOfflineSeoBrief({audit:audit(),trend:base});
  assert.equal(okay.organic.previous.clicks,30);
  assert.equal(okay.recommendedReviews[0].code,'review_click_drop');
  const redacted=buildOfflineSeoBrief({
    audit:audit(),
    trend:{...base,summary:{...base.summary,redactedRows:1}}
  });
  assert.equal(redacted.organic,null);
  assert.deepEqual(redacted.recommendedReviews,[]);
});
