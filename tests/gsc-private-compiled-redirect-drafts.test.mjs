import test from 'node:test';
import assert from 'node:assert/strict';
import {proposePrivateGscBuildRedirects as draft}
 from '../src/gsc-private-compiled-redirect-drafts.mjs';

const row=(url,clicks,impressions)=>({
 keys:[url],clicks,impressions,
 ctr:impressions?clicks/impressions:0,position:17.6
});
const source=(rows,hasMore=false)=>({
 gscPageInput:{
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',
  canonicalOrigin:'https://example.test/',
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],rows,hasMore
 },
 targetRoutes:['/','/produto/','/en/','/en-us/']
});

test('F185 proposes only same-path host/scheme 301s for compiled routes',()=>{
 const x=draft(source([
  row('http://www.example.test/',3,134),
  row('https://www.example.test/produto/',1,103),
  row('https://www.example.test/en-us/',0,70),
  row('https://example.test/',0,1),
  row('https://www.example.test/orphan/',0,15),
  row('https://blog.example.test/',0,5)
 ]));
 assert.equal(x.publicReport.proposedHostSchemeOnly301s,2);
 assert.equal(x.publicReport.unresolvedLegacyRows,2);
 assert.equal(x.publicReport.unscopedSubdomainRows,1);
 assert.equal(x.publicReport.historicalLocaleAliasRows,1);
 assert.equal(x.publicReport.auditedLocalTargetRoutes,4);
 assert.equal(x.privateManifest.legacyUrls.length,4);
 assert.deepEqual(x.privateManifest.candidates,[
  {fromUrl:'http://www.example.test/',toPath:'/',status:301},
  {fromUrl:'https://www.example.test/produto/',toPath:'/produto/',status:301}
 ]);
 assert.equal(x.publicReport.publicationAuthorized,false);
 assert.equal(x.publicReport.productionRulesInstalled,0);
 assert.equal(x.publicReport.liveHttpRedirectsVerified,false);
 assert.equal(x.publicReport.providerSourceType,
  'operator_supplied_gsc_pages_unverified');
 const visible=JSON.stringify(x.publicReport);
 assert.doesNotMatch(visible,/example\.test|orphan|\/produto\/|en-us|https:\/\//);
});
test('F185 never guesses semantic /en-us/ to /en/ nor any missing route',()=>{
 const x=draft(source([
  row('https://www.example.test/en-us/',0,10),
  row('https://www.example.test/absent/',1,100)
 ]));
 assert.deepEqual(x.privateManifest.candidates,[]);
 assert.equal(x.publicReport.unresolvedLegacyRows,2);
 assert.equal(x.publicReport.publicationAuthorized,false);
});
test('F185 hides even host-only suggestions if a single URL has private query',()=>{
 const x=draft(source([
  row('http://www.example.test/',2,44),
  row('https://example.test/?authorization=SECRET',0,1)
 ]));
 assert.equal(x.privateManifest,null);
 assert.equal(x.publicReport.metricsWithheld,true);
 assert.equal(x.publicReport.proposedHostSchemeOnly301s,null);
 assert.equal(x.publicReport.prioritizedReviewIndices,null);
 assert.doesNotMatch(JSON.stringify(x.publicReport),/SECRET|example\.test/);
});
test('F185 treats pagination as incomplete and never implies full coverage',()=>{
 const x=draft(source([row('http://www.example.test/',1,10)],true));
 assert.equal(x.publicReport.paginationIncomplete,true);
 assert.equal(x.publicReport.deploymentAuthorized,false);
 assert.equal(x.privateManifest.candidates.length,1);
});
test('F185 refuses mismatched canonical domain, forged privilege and invalid target',()=>{
 const wrong=source([row('http://www.example.test/',2,10)]);
 wrong.gscPageInput.canonicalOrigin='https://www.example.test/';
 assert.throws(()=>draft(wrong),/F185/);
 const forged=source([row('http://www.example.test/',2,10)]);
 forged.deploy=true;
 assert.throws(()=>draft(forged),/F185/);
 const paths=source([row('http://www.example.test/',2,10)]);
 paths.targetRoutes=['/','/','/en/'];
 assert.throws(()=>draft(paths),/F127/);
 const other=source([row('http://attacker.test/',1,5)]);
 assert.throws(()=>draft(other),/F131/);
});
test('F185 routes needing encoded paths are always held for human triage',()=>{
 const x=draft(source([
  row('https://www.example.test/a%20b/',1,20),
  row('https://www.example.test/',1,30)
 ]));
 assert.equal(x.publicReport.unsafeRouteRows,1);
 assert.equal(x.privateManifest.candidates.length,1);
 assert.equal(x.publicReport.publicationAuthorized,false);
});
