import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewLoopbackServedHtmlParity} from
  '../labs/seo-f142-body-parity/review-loopback-served-html.mjs';
import {inspectHttpRobotsDirectives} from '../src/http-robots-directives.mjs';

const HTML='<!doctype html><html><head><title>Approved static fixture</title></head><body>Unchanged body</body></html>';
const migrationInput=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:'https://example.test/',
  legacyUrls:['http://www.example.test/'],targetRoutes:['/'],
  candidates:[{fromUrl:'http://www.example.test/',toPath:'/',status:301}]
});
async function served(headers,fn){
  const before={APP_ENV:process.env.APP_ENV,
    SEO_F138_LOOPBACK_STAGING:process.env.SEO_F138_LOOPBACK_STAGING};
  const root=await mkdtemp(join(tmpdir(),'seo-f207-'));
  const requests=[];
  const server=http.createServer((req,res)=>{
    requests.push({method:req.method,path:req.url});
    const fields=['Content-Type','text/html; charset=utf-8'];
    for(let i=0;i<headers.length;i++)
      fields.push(i%2?'x-RoBoTs-TaG':'X-Robots-Tag',headers[i]);
    res.writeHead(200,fields);
    res.end(HTML);
  });
  try{
    process.env.APP_ENV='testing';
    process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
    await writeFile(join(root,'index.html'),HTML);
    await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
    const result=await reviewLoopbackServedHtmlParity({
      migrationInput:migrationInput(),buildDirectory:root,
      stagingPort:server.address().port,timeoutMs:1200
    });
    return await fn(result,requests);
  }finally{
    server.closeAllConnections();
    if(server.listening)await new Promise(ok=>server.close(ok));
    await rm(root,{recursive:true,force:true});
    for(const [key,value] of Object.entries(before)){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
}

const blockedCases=[
  ['unscoped noindex',['noindex'],'http_robots_indexing_blocked'],
  ['none',['none'],'http_robots_indexing_blocked'],
  ['Googlebot nofollow',['GoOgLeBoT: NoFoLlOw'],'http_robots_following_blocked'],
  ['a second restrictive field',['all','noindex'],'http_robots_indexing_blocked'],
  ['a new unscoped field after another crawler',['otherbot: noindex','noindex'],'http_robots_indexing_blocked'],
  ['a later Googlebot group',['otherbot: follow, googlebot: none'],'http_robots_indexing_blocked'],
  ['restrictions after preview parameters',['max-snippet:0, max-image-preview:none, noindex'],'http_robots_indexing_blocked'],
  ['Googlebot rules after a scoped parameter',['googlebot: max-snippet:-1, nofollow'],'http_robots_following_blocked'],
  ['a permissive field cannot cancel noindex',['googlebot: noindex','index, follow'],'http_robots_indexing_blocked'],
  ['malformed directives need review',['googlebot: noindex; follow'],'http_robots_policy_review_required'],
  ['scheduled indexing restrictions need review',['unavailable_after: 2099-11-17T12:00:00Z'],'http_robots_policy_review_required']
];
for(const [name,headers,code] of blockedCases){
  test('F207 exact HTML is held for '+name,async()=>{
    await served(headers,(result,requests)=>{
      assert.equal(result.reviewStatus,'blocked');
      assert.deepEqual(result.failureIndices,[{targetRouteIndex:0,code}]);
      assert.equal(result.summary.wrongContentLength,0);
      assert.equal(result.summary.wrongHtmlDigest,0);
      assert.equal(result.summary.identicalHtmlResponses,1);
      assert.equal(result.publicationAuthorized,false);
      assert.equal(result.productionHtmlVerified,false);
      assert.deepEqual(requests,[{method:'GET',path:'/'}]);
      const output=JSON.stringify(result);
      assert.doesNotMatch(output,/example\.test|Approved static|Unchanged body|2099|otherbot|GoOgLeBoT/);
    });
  });
}

const allowedCases=[
  ['no robots header',[]],
  ['permissive repeated fields',['all','index, follow']],
  ['restrictions for a different crawler',['otherbot: noindex, nofollow']],
  ['a different crawler followed by permissive Googlebot rules',['otherbot: none, googlebot: index, follow']],
  ['preview and historical directives',['nosnippet, noimageindex, noarchive, nocache, notranslate, nositelinkssearchbox, indexifembedded','max-snippet:0, max-image-preview:none, max-video-preview:-1']],
  ['permissive Googlebot plus unrelated bot restriction',['Googlebot: all','otherbot: noindex, nofollow']]
];
for(const [name,headers] of allowedCases){
  test('F207 preserves '+name,async()=>{
    await served(headers,result=>{
      assert.equal(result.reviewStatus,'human_independent_served_html_review_required');
      assert.equal(result.summary.identicalHtmlResponses,1);
      assert.deepEqual(result.failureIndices,[]);
      assert.equal(result.publicationAuthorized,false);
    });
  });
}

test('F207 crawler scope survives parameter directives and resets per distinct field',()=>{
  assert.deepEqual(inspectHttpRobotsDirectives([
    'otherbot: max-snippet:0, noindex, nofollow',
    'googlebot-news: none',
    'otherbot: unavailable_after: Wed, 17 Nov 2027 12:00:00 GMT',
    'googlebot: max-image-preview:none, all'
  ]),{noindex:false,nofollow:false,scheduled:false,ambiguous:false});
  assert.equal(inspectHttpRobotsDirectives([
    'otherbot: noindex','noindex'
  ]).noindex,true);
});

test('F207 refuses unbounded or ambiguous directive input without exposing it',()=>{
  for(const fields of [
    'noindex',new Array(33).fill('all'),['a'.repeat(8193)],
    [new Array(257).fill('all').join(',')],['googlebot:'],
    ['googlebot: otherbot: noindex'],['max-image-preview:unexpected'],
    ['max-snippet:0 noindex'],['noindex\u0000'],[null]
  ]){
    const inspected=inspectHttpRobotsDirectives(fields);
    assert.equal(inspected.ambiguous,true);
    assert.deepEqual(Object.keys(inspected),['noindex','nofollow','scheduled','ambiguous']);
    assert.equal(Object.values(inspected).every(value=>typeof value==='boolean'),true);
    assert.equal(Object.isFrozen(inspected),true);
  }
});
