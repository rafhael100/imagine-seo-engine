import test from 'node:test';
import assert from 'node:assert/strict';
import {captureCanonicalPublicHttpEvidence as capture}
 from '../src/canonical-public-http-capture.mjs';
import {reviewCanonicalTargetHttpEvidence as review}
 from '../src/canonical-target-http-evidence-review.mjs';
const origin='https://www.imaginecomunicacao.com.br';
const page=(suffix,canonical)=>({
 pageUrl:origin+suffix,pageStatus:200,
 canonicalHref:canonical===null?null:origin+canonical
});
const fixture=pages=>({
 schema:'imagine.seo.canonical-target-http-evidence.v1',siteOrigin:origin,
 pageEvidence:{sourceType:'operator_supplied_public_html_metadata_unverified',
  observations:pages}
});
test('F217 fetches each exact canonical target once with GET and never follows redirects',async()=>{
 const calls=[];
 const transport=async(url,opts)=>{
  calls.push({url,opts});
  return new Response(null,{status:302,headers:{Location:'/en-us.html'}});
 };
 const result=await capture(fixture([
  page('/en-us','/en-us.html'),page('/en-us/','/en-us.html')
 ]),{transport,timeoutMs:7000});
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,origin+'/en-us.html');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].opts.redirect,'manual');
 assert.equal(calls[0].opts.credentials,'omit');
 assert.equal(calls[0].opts.cache,'no-store');
 assert.equal(calls[0].opts.headers.Authorization,undefined);
 assert.deepEqual(calls[0].opts.headers,{Accept:'text/html'});
 assert.deepEqual(result.targetEvidence.observations,[
  {targetUrl:origin+'/en-us.html',status:302}
 ]);
 const reviewResult=review(result);
 assert.equal(reviewResult.summary.redirectedCanonicalDeclarations,2);
 assert.equal(reviewResult.summary.redirectedDistinctTargets,1);
 assert.equal(reviewResult.releaseAuthorized,false);
});
test('F217 handles exact independent HTML 200 without reading the body',async()=>{
 let read=0,canceled=0;
 const transport=async()=>{
  const stream=new ReadableStream({
   pull(){read++;},
   cancel(){canceled++;}
  });
  return new Response(stream,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
 };
 const r=await capture(fixture([page('/a','/a')]),{transport});
 assert.equal(r.targetEvidence.observations[0].status,200);
 assert.ok(canceled>=1);
 // Streams may prefetch internally; no code ever calls response.text()/arrayBuffer().
 assert.equal(review(r).reviewStatus,'human_editorial_http_review_required');
});
test('F217 blocks off-origin, forged, duplicate and no-canonical lists before GET',async()=>{
 let calls=0;
 const transport=async()=>{calls++;return new Response(null,{status:200,
  headers:{'content-type':'text/html'}});};
 const inputs=[
  {...fixture([page('/a','/a')]),siteOrigin:'https://other.test'},
  fixture([page('/a',null)]),
  fixture([page('/a','/a'),page('/a','/a')]),
  fixture([page('/a','/a?token=SECRET')]),
  fixture([page('/a','/a')])
 ];
 inputs[3].pageEvidence.observations[0].canonicalHref+= '?token=SECRET';
 inputs[4].pageEvidence.observations[0].canonicalHref='https://other.test/x';
 for(const input of inputs){
  await assert.rejects(()=>capture(input,{transport}),/SEO F217/);
 }
 assert.equal(calls,0);
});
test('F217 rejects HTML-like JSON, malformed responses and transport exceptions',async()=>{
 const x=fixture([page('/a','/a')]);
 for(const transport of [
  async()=>new Response('{"fake":true}',{status:200,headers:{'content-type':'application/json'}}),
  async()=>({status:200}),
  async()=>{throw Error('PRIVATE_PATH_AND_SECRET');}
 ])await assert.rejects(()=>capture(x,{transport}),error=>{
  assert.match(error.message,/SEO F217/);
  assert.doesNotMatch(error.message,/PRIVATE_PATH|SECRET|example/);
  return true;
 });
});
test('F217 refuses invalid or unbounded timeouts before any network call',async()=>{
 let count=0;const transport=async()=>{count++;return new Response(null,{status:302});};
 for(const timeoutMs of [0,1,999,10001,Infinity,NaN,1000.1,'7000',null]){
  await assert.rejects(()=>capture(fixture([page('/a','/a')]),
    {transport,timeoutMs}),/SEO F217/);
 }
 assert.equal(count,0);
});
test('F217 fails closed on the first GET failure without retry or partial result',async()=>{
 let count=0;
 const transport=async()=>{count++;throw Error('HTTP_TIME_OUT_WITH_SECRET');};
 await assert.rejects(()=>capture(fixture([
  page('/a','/a'),page('/b','/b')
 ]),{transport}),/SEO F217/);
 assert.equal(count,1);
});
test('F217 refuses more than 50 distinct targets before any GET',async()=>{
 let count=0;
 const pages=Array.from({length:51},(_,i)=>page('/page'+i,'/target'+i));
 await assert.rejects(()=>capture(fixture(pages),{
  transport:async()=>{count++;return new Response(null,{status:302});}
 }),/SEO F217/);
 assert.equal(count,0);
});

test('F219 records canonical HTTP status without waiting for a stuck stream cancel',async()=>{
 let canceled=0;
 const transport=async()=>new Response(new ReadableStream({
  cancel(){canceled++;return new Promise(()=>{});}
 }),{status:200,headers:{'content-type':'text/html'}});
 let guard;
 const timeout=new Promise((_,reject)=>{
  guard=setTimeout(()=>reject(Error('canonical evidence blocked on body cancel')),1000);
 });
 try{
  const result=await Promise.race([
   capture(fixture([page('/slow','/slow')]),{transport}),timeout
  ]);
  assert.equal(canceled,1,'body cancellation must still be attempted');
  assert.deepEqual(result.targetEvidence.observations,[
   {targetUrl:origin+'/slow',status:200}
  ]);
  assert.equal(review(result).reviewStatus,'human_editorial_http_review_required');
 }finally{clearTimeout(guard);}
});

test('F220 cancels rejected response body without waiting or moving to another target',async()=>{
 let canceled=0,calls=0;
 const transport=async()=>{
  calls++;
  return new Response(new ReadableStream({
   cancel(){canceled++;return new Promise(()=>{});}
  }),{status:200,headers:{'content-type':'application/json'}});
 };
 let guard;
 const timeout=new Promise((_,reject)=>{
  guard=setTimeout(()=>reject(Error('rejected response blocked on cancellation')),1000);
 });
 try{
  await assert.rejects(Promise.race([
   capture(fixture([page('/a','/a'),page('/b','/b')]),{transport}),timeout
  ]),/SEO F217/);
  assert.equal(canceled,1);
  assert.equal(calls,1);
 }finally{clearTimeout(guard);}
});
