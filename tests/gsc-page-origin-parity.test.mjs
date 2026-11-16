import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewOfflineGscPageOrigins as review} from '../src/gsc-page-origin-parity.mjs';

function row(url,clicks,impressions){
  return {keys:[url],clicks,impressions,
    ctr:impressions===0?0:clicks/impressions,position:12};
}
const base=rows=>({
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',
  canonicalOrigin:'https://example.test/',
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],rows,hasMore:false
});
test('F131 audits HTTPS, legacy HTTP and www without echoing actual private URLs',()=>{
 const input=base([
   row('https://www.example.test/',5,1132),
   row('http://www.example.test/',3,134),
   row('https://example.test/',0,1),
   row('https://example.test/servicos/a/',1,100)
 ]);
 const result=review(input);
 assert.equal(result.summary.receivedRows,4);
 assert.equal(result.summary.originBuckets.canonicalHttps.pageRows,2);
 assert.equal(result.summary.originBuckets.alternateWwwHttps.impressions,1132);
 assert.equal(result.summary.originBuckets.alternateWwwHttp.impressions,134);
 assert.equal(result.summary.noncanonicalImpressions,1266);
 assert.equal(result.summary.noncanonicalClicks,8);
 assert.equal(result.summary.logicalPathsWithMultipleOrigins,1);
 assert.equal(result.summary.homeOriginVariants,3);
 assert.ok(result.reviewSignals.includes('review_http_legacy_index_signals'));
 assert.ok(result.reviewSignals.includes('review_www_apex_canonical_consistency'));
 assert.ok(result.reviewSignals.includes('review_same_path_across_origins'));
 assert.ok(result.reviewSignals.includes('review_homepage_origin_variants'));
 for(const k of ['oauthVerified','tenantPropertyGrantVerified',
  'liveHttpRedirectVerified','productionCanonicalVerified',
  'queryCompletenessVerified','customerDisplayAuthorized',
  'publicationAuthorized','networkPerformed'])
  assert.equal(result[k],false,k);
 const output=JSON.stringify(result);
 for(const privateValue of ['example.test','/servicos/a/','http://','https://'])
   assert.equal(output.includes(privateValue),false,privateValue);
});
test('F131 does not imply that all rows were returned when more pages exist',()=>{
 const input=base([row('https://example.test/',1,10)]);
 input.hasMore=true;
 const result=review(input);
 assert.equal(result.coverageStatus,'PAGINATION_REMAINS');
 assert.equal(result.summary.originBuckets.canonicalHttps.impressions,10);
 assert.equal(result.queryCompletenessVerified,false);
 assert.deepEqual(result.reviewSignals,[]);
});
test('F131 withholds all metrics when URL contains private query or fragment',()=>{
 const data=base([
  row('https://www.example.test/?email=private%40example.test',1,10),
  row('https://example.test/',3,55)
 ]);
 const result=review(data);
 assert.equal(result.reviewStatus,'METRICS_WITHHELD_PRIVATE_URLS');
 assert.equal(result.summary.redactedRows,1);
 assert.equal(result.summary.originBuckets,null);
 assert.equal(result.summary.noncanonicalImpressions,null);
 assert.deepEqual(result.reviewSignals,[]);
 const out=JSON.stringify(result);
 for(const secret of ['private','email','example.test'])
  assert.equal(out.includes(secret),false,secret);
});
test('F131 separates other subdomains and recognizes URL-prefix mismatch',()=>{
 const result=review(base([
  row('https://blog.example.test/news/',0,90),
  row('http://blog.example.test/news/',0,5),
  row('https://example.test/news/',1,11)
 ]));
 assert.equal(result.summary.originBuckets.otherSubdomainHttps.pageRows,1);
 assert.equal(result.summary.originBuckets.otherSubdomainHttp.pageRows,1);
 assert.equal(result.summary.logicalPathsWithMultipleOrigins,1);
 assert.throws(()=>review({...base([row('https://example.test/',0,1)]),
   property:'https://example.test/'}),/domain-property/);
});
test('F131 rejects foreign domain, credentials, unsafe paths, duplicate or bad stats',()=>{
 const invalid=[
  base([]),
  base([row('https://foreign.test/',0,9)]),
  base([row('https://example.test:8080/',0,9)]),
  base([row('https://evil@example.test/',0,9)]),
  base([row('https://example.test/%2e%2e/secret/',0,9)]),
  base([row('https://example.test/a\\b/',0,9)]),
  base([row('https://example.test/',0,9),row('https://example.test/',0,9)]),
  base([{...row('https://example.test/',1,1),ctr:0.1}]),
  base([{...row('https://example.test/',2,1)}]),
  {...base([row('https://example.test/',0,9)]),authorization:true},
  {...base([row('https://example.test/',0,9)]),dataState:'all'}
 ];
 for(const bad of invalid)
  assert.throws(()=>review(bad),/SEO F131|SEO GSC plan/);
});
test('F131 rejects sparse arrays, accessors, symbols and malformed calendar',()=>{
 const good=base([row('https://example.test/',0,5)]);
 const sparse=Array(2);sparse[0]=row('https://example.test/',0,5);
 assert.throws(()=>review({...good,rows:sparse}),/SEO F131/);
 const getter=row('https://example.test/',0,5);
 Object.defineProperty(getter,'keys',{enumerable:true,get(){throw Error('private')}}); 
 assert.throws(()=>review({...good,rows:[getter]}),/SEO F131/);
 const sym=row('https://example.test/',0,5);sym[Symbol('auth')]=true;
 assert.throws(()=>review({...good,rows:[sym]}),/SEO F131/);
 assert.throws(()=>review({...good,endDate:'2026-02-30'}),/GSC:/);
});
