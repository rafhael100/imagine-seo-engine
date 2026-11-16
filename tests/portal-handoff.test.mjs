import test from 'node:test';
import assert from 'node:assert/strict';
import {preparePortalSeoHandoff} from '../src/portal-handoff.mjs';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';
const report={summary:{pages:3,errors:1,warnings:0},
  errors:[{type:'wrong_canonical',file:'PRIVATE/contact.html',message:'SECRET-QUERY-PAYLOAD'}],
  warnings:[],routes:['/','/user@example.com/','/servicos/']};
const scope={tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
  sourceRevision:'b'.repeat(40)};
const brief=()=>buildOfflineSeoBrief({audit:report});

test('prepares a strictly sanitised, non-displayable Portal envelope',()=>{
  const handoff=preparePortalSeoHandoff({...scope,brief:brief()});
  assert.equal(handoff.contractVersion,'seo-portal-review-handoff-v1');
  assert.equal(handoff.customerDisplayAuthorized,false);
  assert.equal(handoff.propertyAuthorizationVerified,false);
  assert.equal(handoff.backendTenantGrantVerified,false);
  assert.equal(handoff.publicationAuthorized,false);
  assert.equal(handoff.technical.errors,1);
  assert.equal(handoff.suggestedReviews[0].code,'repair_canonical');
  assert.doesNotMatch(JSON.stringify(handoff),/SECRET-QUERY|PRIVATE\/contact|user@example.com/);
});
test('rejects missing tenant/property and unreviewed revision inputs',()=>{
  for(const change of [{tenantRef:'bad tenant'},{propertyFingerprint:'bad'},
    {sourceRevision:'main'},{sourceRevision:'c'.repeat(39)}]){
    assert.throws(()=>preparePortalSeoHandoff({...scope,...change,brief:brief()}),
      /offline scope or revision/);
  }
});
test('does not trust a customer-visible display flag supplied by caller',()=>{
  const dangerous={...brief(),customerDisplayAuthorized:true,publicationAuthorized:true,
    rawQuery:'private@example.com',suggestedReviews:[
      {code:'review_indexation',priority:'critical',count:2,details:'PERSONAL-DATA'}
    ]};
  const output=preparePortalSeoHandoff({...scope,brief:dangerous});
  assert.equal(output.customerDisplayAuthorized,false);
  assert.equal(output.publicationAuthorized,false);
  assert.doesNotMatch(JSON.stringify(output),/PERSONAL-DATA|private@example.com/);
});
test('rejects invented action codes, duplicate entries and forged brief version',()=>{
  assert.throws(()=>preparePortalSeoHandoff({...scope,
    brief:{...brief(),contractVersion:'seo-brief-authenticated-v9'}}),
  /compatible brief/);
  assert.throws(()=>preparePortalSeoHandoff({...scope,
    brief:{...brief(),recommendedReviews:[{code:'CLICK_TO_DEPLOY',priority:'critical',count:2}]}}),
  /unrecognized review/);
  assert.throws(()=>preparePortalSeoHandoff({...scope,
    brief:{...brief(),recommendedReviews:[
      {code:'fix_sitemap',priority:'high',count:2},
      {code:'fix_sitemap',priority:'high',count:1}
    ]}}),/duplicate review/);
});
test('rejects contradictory status and recalculates trend deltas from aggregate counts',()=>{
  assert.throws(()=>preparePortalSeoHandoff({...scope,
    brief:{...brief(),technical:{status:'no_findings_in_supplied_audit',pages:3,errors:1,warnings:0}}}),
  /inconsistent technical/);
  const value=preparePortalSeoHandoff({...scope,brief:{...brief(),organic:{
    days:7,previous:{clicks:20,impressions:100},current:{clicks:10,impressions:80},
    clicksChangeFraction:999,impressionsChangeFraction:999,raw:'LEAK-ME'
  }}});
  assert.equal(value.organic.clicksChangeFraction,-.5);
  assert.equal(value.organic.impressionsChangeFraction,-.2);
  assert.doesNotMatch(JSON.stringify(value),/LEAK-ME|999/);
});
