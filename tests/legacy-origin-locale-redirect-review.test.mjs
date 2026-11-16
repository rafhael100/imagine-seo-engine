import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewLegacyOriginAndLocaleRedirects as review}
 from '../src/legacy-origin-locale-redirect-review.mjs';
const root='example.test',nonwww='https://'+root+'/';
const inventory=overrides=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:root,
  canonicalOrigin:nonwww,
  legacyUrls:[
    'https://www.example.test/',
    'http://www.example.test/',
    'http://example.test/',
    'https://www.example.test/en-us/',
    'https://www.example.test/en-us/contact-us.html',
    'https://example.test/en/'
  ],
  targetRoutes:['/','/en/','/en/contact/','/es/'],
  candidates:[
    {fromUrl:'https://www.example.test/',toPath:'/',status:301},
    {fromUrl:'http://www.example.test/',toPath:'/',status:301},
    {fromUrl:'http://example.test/',toPath:'/',status:301},
    {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301},
    {fromUrl:'https://www.example.test/en-us/contact-us.html',toPath:'/en/contact/',status:301}
  ],
  ...overrides
});
test('F127 inventories legacy http/www and /en-us aliases without issuing redirects',()=>{
  const report=review(inventory());
  assert.equal(report.reviewStatus,'human_redirect_review_required');
  assert.equal(report.summary.legacyUrlCount,6);
  assert.equal(report.summary.reviewed301Candidates,5);
  assert.equal(report.summary.observedHttpUrls,2);
  assert.equal(report.summary.observedWwwUrls,4);
  assert.equal(report.summary.observedLegacyEnglishUrls,2);
  assert.equal(report.summary.legacyEnglishAliasReviewCount,2);
  assert.equal(report.summary.alreadyCanonicalCount,1);
  assert.equal(report.summary.unmappedCount,0);
  assert.equal(report.summary.localeMismatchCount,0);
  assert.deepEqual(report.aliasReviewIndices,[3,4]);
  for(const flag of ['contentEquivalenceVerified',
    'redirectTargetsServedInProduction','originalHttpStatusesVerified',
    'sourceGoogleSearchConsoleAuthenticated','backlinksChecked',
    'redirectsAuthorized','deploymentAuthorized','indexingAuthorized',
    'networkPerformed'])assert.equal(report[flag],false,flag);
  assert.equal(report.liveRedirectsApplied,0);
  for(const secret of ['example.test','contact-us.html','/en/contact/','www.example'])
    assert.equal(JSON.stringify(report).includes(secret),false,secret);
});
test('F127 blocks a legacy URL lacking an explicit equivalent mapping',()=>{
  const original=inventory();
  const result=review(inventory({candidates:original.candidates.slice(0,-1)}));
  assert.equal(result.reviewStatus,'blocked');
  assert.equal(result.summary.unmappedCount,1);
  assert.deepEqual(result.unmappedIndices,[4]);
});
test('F127 blocks bilingual cross-language redirect despite complete coverage',()=>{
  const original=inventory();
  const candidates=[...original.candidates];
  candidates[4]={...candidates[4],toPath:'/es/'};
  const result=review(inventory({candidates}));
  assert.equal(result.reviewStatus,'blocked');
  assert.equal(result.summary.localeMismatchCount,1);
  assert.deepEqual(result.localeMismatchIndices,[4]);
  assert.equal(result.summary.unmappedCount,0);
});
test('F127 disallows external redirect, user-info, query, fragments and encoded tricks',()=>{
  const base=inventory();
  for(const bad of [
    'https://evil.test/','https://evil.test@www.example.test/',
    'https://www.example.test:8443/','https://www.example.test/?token=1',
    'https://www.example.test/#secret','https://www.example.test/%2e%2e/admin',
    'ftp://www.example.test/','https://www.example.test//other'
  ]){
    assert.throws(()=>review(inventory({
      legacyUrls:[bad],candidates:[]
    })),/unapproved legacy URL|unsafe legacy route/,bad);
  }
  assert.throws(()=>review(inventory({
    siteDomain:'example.test.evil.test'
  })),/invalid bounded legacy migration input|unapproved legacy URL/);
  assert.throws(()=>review(inventory({canonicalOrigin:'https://www.example.test/'})),
    /invalid bounded legacy migration input/);
});
test('F127 rejects unsafe targets, duplicate sources and spoofed publish authority',()=>{
  const original=inventory();
  for(const target of ['/not-built/','//evil.test/','/en/%2e%2e/','/404.html?x=1']){
    assert.throws(()=>review(inventory({
      candidates:[...original.candidates.slice(0,-1),{
        fromUrl:original.candidates.at(-1).fromUrl,toPath:target,status:301
      }]
    })),/non-build redirect target|unsafe legacy route/);
  }
  assert.throws(()=>review(inventory({
    candidates:[...original.candidates,original.candidates[0]]
  })),/duplicate or non-build redirect target/);
  assert.throws(()=>review(inventory({
    candidates:original.candidates.map(e=>({...e,status:302}))
  })),/invalid 301/);
  assert.throws(()=>review(inventory({publish:true})),/invalid bounded/);
});
test('F127 blocks redirect loops and malformed arrays or unexpected candidate metadata',()=>{
  assert.throws(()=>review(inventory({
    candidates:[{fromUrl:'https://example.test/en/',toPath:'/en/',status:301}]
  })),/canonical redirect loop/);
  const sparse=Array(2);sparse[0]='http://www.example.test/';
  assert.throws(()=>review(inventory({legacyUrls:sparse})),/invalid bounded/);
  assert.throws(()=>review(inventory({
    candidates:[{...inventory().candidates[0],cookie:'secret'}]
  })),/invalid 301/);
});
test('F127 bounds 20k candidates and redacts ordinal diagnostics',()=>{
  const urls=Array.from({length:220},(_,i)=>
    'http://www.example.test/legacy-'+i+'.html');
  const report=review(inventory({legacyUrls:urls,candidates:[]}));
  assert.equal(report.summary.unmappedCount,220);
  assert.equal(report.unmappedIndices.length,200);
  assert.equal(report.summary.omittedUnmappedIndices,20);
  assert.equal(report.reviewStatus,'blocked');
  assert.doesNotMatch(JSON.stringify(report),/legacy-0\.html|example\.test/);
});
