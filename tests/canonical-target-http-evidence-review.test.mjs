import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewCanonicalTargetHttpEvidence as review} from
 '../src/canonical-target-http-evidence-review.mjs';
const base='https://example.test';
const page=(url,canonicalHref)=>({pageUrl:base+url,pageStatus:200,
 canonicalHref:canonicalHref===null?null:base+canonicalHref});
const target=(url,status=200)=>({targetUrl:base+url,status});
const fixture=(pages,targets)=>({
 schema:'imagine.seo.canonical-target-http-evidence.v1',siteOrigin:base,
 pageEvidence:{sourceType:'operator_supplied_public_html_metadata_unverified',
  observations:pages},
 targetEvidence:{sourceType:'operator_supplied_independent_public_http_get_unverified',
  observations:targets}
});
test('F215 exact target 200 for three pages is review-only, not release',()=>{
 const a=review(fixture([page('/','/'),page('/a','/a.html'),page('/a/','/a.html')],
  [target('/'),target('/a.html')]));
 assert.equal(a.reviewStatus,'human_editorial_http_review_required');
 assert.equal(a.summary.pagesObserved,3);
 assert.equal(a.summary.canonicalTargetHttp200Declarations,3);
 assert.equal(a.summary.distinctDeclaredTargets,2);
 assert.equal(a.summary.nonSelfCanonicalDeclarations,2);
 assert.deepEqual(a.diagnostics,[]);
 assert.equal(a.releaseAuthorized,false);
 assert.equal(a.redirectsAuthorized,0);
 assert.equal(a.networkPerformed,false);
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.summary));
});
test('F215 detects two canonical declarations targeting one observed HTTP 302',()=>{
 const a=review(fixture([page('/en-us','/en-us.html'),page('/en-us/','/en-us.html')],
  [target('/en-us.html',302)]));
 assert.equal(a.reviewStatus,'blocked');
 assert.equal(a.summary.redirectedCanonicalDeclarations,2);
 assert.equal(a.summary.redirectedDistinctTargets,1);
 assert.deepEqual(a.diagnostics,[
  {pageIndex:0,code:'canonical_target_redirect'},
  {pageIndex:1,code:'canonical_target_redirect'}
 ]);
 assert.doesNotMatch(JSON.stringify(a),/example\.test|en-us/);
});
test('F215 distinguishes missing canonical, target 404 and absent GET evidence',()=>{
 const a=review(fixture([page('/a',null),page('/b','/b'),page('/c','/c')],
  [target('/b',404)]));
 assert.equal(a.reviewStatus,'blocked');
 assert.equal(a.summary.missingCanonicalDeclarations,1);
 assert.equal(a.summary.failedCanonicalDeclarations,1);
 assert.equal(a.summary.unobservedCanonicalTargets,1);
 assert.deepEqual(a.diagnostics.map(x=>x.code),[
  'missing_canonical','canonical_target_non_200','canonical_target_unobserved'
 ]);
});
test('F215 flags off-origin canonical without disclosing the hostname',()=>{
 const inp=fixture([page('/en','/en')],[target('/en')]);
 inp.pageEvidence.observations[0].canonicalHref='https://other.test/en';
 inp.targetEvidence.observations=[];
 const a=review(inp);
 assert.equal(a.summary.offOriginCanonicalDeclarations,1);
 assert.equal(a.reviewStatus,'blocked');
 assert.doesNotMatch(JSON.stringify(a),/other\.test|example\.test/);
});
test('F215 rejects duplicate page, duplicate target and unrelated HTTP evidence',()=>{
 const p=page('/a','/a'),t=target('/a');
 for(const x of [fixture([p,p],[t]),fixture([p],[t,t]),
  fixture([p],[t,target('/unrelated')])])
  assert.throws(()=>review(x),/SEO F215/);
});
test('F215 rejects malformed, ambiguous and credential-bearing URLs',()=>{
 const bad=['http://example.test/a','https://example.test/a?q=token',
  'https://example.test/a#x','https://user:pass@example.test/a',
  'https://EXAMPLE.test/a','//example.test/a',
  'https://example.test/a ','https://example.test/a%00#y'];
 for(const u of bad){
  const inp=fixture([page('/a','/a')],[target('/a')]);
  inp.pageEvidence.observations[0].canonicalHref=u;
  assert.throws(()=>review(inp),/SEO F215/,u);
 }
 const inp=fixture([page('/a','/a')],[target('/a')]);
 inp.siteOrigin='https://example.test/';
 assert.throws(()=>review(inp),/SEO F215/);
});
test('F215 denies hostile shapes without executing getters',()=>{
 const correct=fixture([page('/a','/a')],[target('/a')]);
 let getterCount=0;
 const hostile=structuredClone(correct);
 Object.defineProperty(hostile.pageEvidence.observations[0],'pageStatus',{
  enumerable:true,get(){getterCount++;throw Error('SECRET');}
 });
 assert.throws(()=>review(hostile),/SEO F215/);
 assert.equal(getterCount,0);
 for(const mutate of [
  x=>{x.allowDeploy=true;},
  x=>{x.pageEvidence.observations[0].html='SECRET';},
  x=>{delete x.pageEvidence.observations[0];},
  x=>{x.targetEvidence.observations[0].status='302';},
  x=>{x.pageEvidence.observations[0].pageStatus=301;},
  x=>{Object.setPrototypeOf(x.pageEvidence.observations[0],{});}
 ]){
  const inp=structuredClone(correct);mutate(inp);
  assert.throws(()=>review(inp),/SEO F215/);
 }
});
test('F215 caps fixed-code diagnostics and never prints raw URL',()=>{
 const pages=Array.from({length:250},(_,i)=>page('/test-'+i,null));
 const a=review(fixture(pages,[]));
 assert.equal(a.summary.missingCanonicalDeclarations,250);
 assert.equal(a.diagnostics.length,200);
 assert.equal(a.summary.omittedDiagnostics,50);
 assert.doesNotMatch(JSON.stringify(a),/example\.test|test-249/);
});
test('F215 refuses falsified provenance even for status 200',()=>{
 const inp=fixture([page('/a','/a')],[target('/a')]);
 inp.targetEvidence.sourceType='fake-certification';
 assert.throws(()=>review(inp),/SEO F215/);
});
