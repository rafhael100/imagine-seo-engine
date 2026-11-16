import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {probeLoopbackLegacyRedirects as probe} from
  '../labs/seo-f138-loopback/probe-loopback.mjs';

const manifest=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:'https://example.test/',
  legacyUrls:['http://www.example.test/','https://www.example.test/en-us/'],
  targetRoutes:['/','/en/'],
  candidates:[
    {fromUrl:'http://www.example.test/',toPath:'/',status:301},
    {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
});
async function withLocalServer(handler,run){
  const requests=[];
  const server=createServer((req,res)=>{
    requests.push({method:req.method,host:req.headers.host,path:req.url});
    handler(req,res);
  });
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',resolve);
  });
  const previous=process.env.SEO_F138_ALLOW_LOCAL_HEAD;
  process.env.SEO_F138_ALLOW_LOCAL_HEAD='1';
  try{
    await run({port:server.address().port,requests});
  }finally{
    if(previous===undefined)delete process.env.SEO_F138_ALLOW_LOCAL_HEAD;
    else process.env.SEO_F138_ALLOW_LOCAL_HEAD=previous;
    await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  }
}
function correctHandler(req,res){
  if(req.headers.host==='www.example.test'&&req.url==='/'){
    res.writeHead(301,{Location:'https://example.test/'}).end();
  }else if(req.headers.host==='www.example.test'&&req.url==='/en-us/'){
    res.writeHead(301,{Location:'https://example.test/en/'}).end();
  }else if(req.headers.host==='example.test'&&['/','/en/'].includes(req.url)){
    res.writeHead(200,{'Content-Type':'text/html'}).end();
  }else res.writeHead(404).end();
}
test('F138 makes real HEAD requests on loopback only, then checks exact 301 receipts',async()=>{
 await withLocalServer(correctHandler,async({port,requests})=>{
  const out=await probe({migrationInput:manifest(),loopbackPort:port});
  assert.equal(out.reviewStatus,'human_http_staging_review_required');
  assert.equal(out.summary.expectedRedirects,2);
  assert.equal(out.summary.matched301ToCanonical,2);
  assert.equal(out.summary.extraHopsCount,0);
  assert.equal(out.localHeadRequestsPerformed,true);
  assert.equal(out.loopbackAddressPinned,true);
  assert.equal(out.publicInternetRequested,false);
  assert.equal(out.externalDnsResolutionPerformed,false);
  assert.equal(out.actualPublicTlsVerified,false);
  assert.equal(out.publicationAuthorized,false);
  assert.deepEqual(requests.map(x=>x.method),['HEAD','HEAD','HEAD','HEAD']);
  assert.deepEqual(requests.map(x=>x.host),[
    'www.example.test','example.test','www.example.test','example.test'
  ]);
  assert.doesNotMatch(JSON.stringify(out),/example.test|http:\/\//);
 });
});
test('F138 never follows a foreign Location, even when server returns 301',async()=>{
 await withLocalServer((req,res)=>{
   if(req.headers.host==='www.example.test')
     res.writeHead(301,{Location:'https://evil.test/?private=token'}).end();
   else res.writeHead(200).end();
 },async({port,requests})=>{
  const out=await probe({migrationInput:manifest(),loopbackPort:port});
  assert.equal(out.reviewStatus,'blocked');
  assert.equal(out.summary.wrongLocationOrFinalUrlCount,2);
  assert.equal(out.summary.wrongFinalStatusCount,2);
  assert.equal(requests.length,2,'must not resolve or follow foreign Location');
  assert.doesNotMatch(JSON.stringify(out),/evil.test|token|example.test/);
 });
});
test('F138 rejects 302 and second redirect hop at local canonical endpoint',async()=>{
 await withLocalServer((req,res)=>{
   if(req.headers.host==='www.example.test')
     res.writeHead(302,{Location:'https://example.test'+
       (req.url==='/en-us/'?'/en/':'/')}).end();
   else res.writeHead(302,{Location:'https://example.test/another/'}).end();
 },async({port})=>{
   const out=await probe({migrationInput:manifest(),loopbackPort:port});
   assert.equal(out.reviewStatus,'blocked');
   assert.equal(out.summary.wrongRedirectStatusCount,2);
   assert.equal(out.summary.wrongFinalStatusCount,2);
   assert.equal(out.summary.extraHopsCount,2);
   assert.equal(out.summary.matched301ToCanonical,0);
 });
});
test('F138 cannot probe unapproved, extra field, privileged port or environment',async()=>{
 await withLocalServer(correctHandler,async({port,requests})=>{
  const saved=process.env.SEO_F138_ALLOW_LOCAL_HEAD;
  process.env.SEO_F138_ALLOW_LOCAL_HEAD='0';
  await assert.rejects(
    probe({migrationInput:manifest(),loopbackPort:port}),/SEO F138/);
  process.env.SEO_F138_ALLOW_LOCAL_HEAD=saved;
  await assert.rejects(probe({migrationInput:manifest(),loopbackPort:443}),/SEO F138/);
  await assert.rejects(probe({
    migrationInput:manifest(),loopbackPort:port,deploy:true
  }),/SEO F138/);
  const wrong=manifest();
  wrong.candidates[0].fromUrl='https://evil.test/';
  await assert.rejects(probe({migrationInput:wrong,loopbackPort:port}),/SEO F127/);
  assert.equal(requests.length,0);
 });
});
