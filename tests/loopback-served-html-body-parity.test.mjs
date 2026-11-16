import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewLoopbackServedHtmlParity as review} from
  '../labs/seo-f142-body-parity/review-loopback-served-html.mjs';

const HOME='<!doctype html><html lang="pt-BR"><head><title>Imagine original</title></head><body>Regional services</body></html>';
const EN='<!doctype html><html lang="en"><head><title>International</title></head><body>Independent English copy</body></html>';
const ROOT='https://example.test/';
function manifest(){
  return {
    sourceType:'operator_supplied_legacy_urls_unverified',
    siteDomain:'example.test',canonicalOrigin:ROOT,
    legacyUrls:[
      'http://www.example.test/',
      'https://www.example.test/en-us/'
    ],
    targetRoutes:['/','/en/'],
    candidates:[
      {fromUrl:'http://www.example.test/',toPath:'/',status:301},
      {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
    ]
  };
}
async function fixture(run,mode='valid'){
 const root=await mkdtemp(join(tmpdir(),'seo-f142-'));
 const dist=join(root,'site');
 await mkdir(dist);
 await mkdir(join(dist,'en'));
 await writeFile(join(dist,'index.html'),HOME);
 await writeFile(join(dist,'en','index.html'),EN);
 const seen=[];
 const server=http.createServer((req,res)=>{
   seen.push({method:req.method,host:req.headers.host,proto:req.headers['x-forwarded-proto'],path:req.url});
   const home=req.url==='/';
   let body=home?HOME:EN;
   if(mode==='stale'&&!home)body=body.replace('English','Other__'); // same byte length
   if(mode==='oversized')body='x'.repeat(2*1024*1024+1);
   const status=mode==='redirect'&&!home?302:200;
   const headers={'Content-Type':mode==='bad-type'?'text/plain':'text/html; charset=utf-8'};
   if(mode==='compressed')headers['Content-Encoding']='gzip';
   if(mode==='redirect')headers.Location='https://evil.test/private';
   res.writeHead(status,headers);
   res.end(body);
 });
 await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
 try{return await run({root,dist,seen,port:server.address().port});}
 finally{
   await new Promise(ok=>server.close(ok));
   await rm(root,{force:true,recursive:true});
 }
}
const staging=async fn=>{
 const old={APP_ENV:process.env.APP_ENV,
  SEO_F138_LOOPBACK_STAGING:process.env.SEO_F138_LOOPBACK_STAGING};
 process.env.APP_ENV='testing';
 process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
 try{return await fn();}
 finally{for(const [k,v] of Object.entries(old))
  v===undefined?delete process.env[k]:process.env[k]=v;}
};
const probe=({dist,port})=>review({
  migrationInput:manifest(),buildDirectory:dist,
  stagingPort:port,timeoutMs:2000
});
test('F142 verifies GET bytes of every approved static target and no external fetch',async()=>{
 await fixture(async a=>staging(async()=>{
  const result=await probe(a);
  assert.equal(result.reviewStatus,'human_independent_served_html_review_required');
  assert.equal(result.summary.targetsDeclared,2);
  assert.equal(result.summary.identicalHtmlResponses,2);
  assert.equal(result.summary.loopbackGetRequests,2);
  assert.equal(result.summary.wrongHtmlDigest,0);
  assert.deepEqual(result.failureIndices,[]);
  for(const key of ['trustedProxyIdentityVerified','tlsAndSniVerified',
   'realGscTenantVerified','productionHtmlVerified','publicationAuthorized'])
   assert.equal(result[key],false,key);
  assert.deepEqual(a.seen.map(x=>x.method),['GET','GET']);
  assert.deepEqual(a.seen.map(x=>x.host),['example.test','example.test']);
  assert.deepEqual(a.seen.map(x=>x.path),['/','/en/']);
  assert.deepEqual(a.seen.map(x=>x.proto),['https','https']);
  for(const secret of ['example.test','https://','/en/','Regional services'])
   assert.equal(JSON.stringify(result).includes(secret),false,secret);
 }));
});
test('F142 rejects stale HTML whose byte count matches but SHA differs',async()=>{
 await fixture(async a=>staging(async()=>{
  const output=await probe(a);
  assert.equal(output.reviewStatus,'blocked');
  assert.equal(output.summary.wrongHtmlDigest,1);
  assert.equal(output.summary.wrongContentLength,0);
  assert.deepEqual(output.failureIndices,[{
    targetRouteIndex:1,code:'served_html_digest_mismatch'
  }]);
 }), 'stale');
});
test('F142 does not follow a 302 Location to a foreign host',async()=>{
 await fixture(async a=>staging(async()=>{
  const output=await probe(a);
  assert.equal(output.reviewStatus,'blocked');
  assert.equal(output.summary.wrongStatus,1);
  assert.equal(a.seen.length,2);
  assert.equal(output.failureIndices[0].code,'non_200_html_status');
  assert.doesNotMatch(JSON.stringify(output),/evil\.test|private/);
 }), 'redirect');
});
test('F142 rejects non-identity encoding and non-HTML content type',async()=>{
 for(const [mode,key] of [['compressed','unexpectedEncoding'],['bad-type','unexpectedContentType']]){
  await fixture(async a=>staging(async()=>{
   const output=await probe(a);
   assert.equal(output.reviewStatus,'blocked');
   assert.equal(output.summary[key],2);
  }),mode);
 }
});
test('F142 fails closed on oversized GET body',async()=>{
 await fixture(async a=>staging(async()=>{
  await assert.rejects(probe(a),/SEO F142/);
 }), 'oversized');
});
test('F142 requires consent and does not contact HTTP for local symlink or unknown routes',async()=>{
 await fixture(async a=>{
  await assert.rejects(probe(a),/SEO F142/);
  assert.equal(a.seen.length,0);
  await staging(async()=>{
   await assert.rejects(review({
     migrationInput:manifest(),buildDirectory:a.dist,
     stagingPort:80,timeoutMs:2000
   }),/SEO F142/);
   const original=join(a.dist,'en','index.html');
   await rm(original);
   await symlink(join(a.dist,'index.html'),original);
   await assert.rejects(probe(a),/SEO F142/);
   assert.equal(a.seen.length,0);
  });
 });
});
test('F142 cannot accept extra fields that pretend to authorize production',async()=>{
 await fixture(async a=>staging(async()=>{
   await assert.rejects(review({
     migrationInput:manifest(),buildDirectory:a.dist,
     stagingPort:a.port,timeoutMs:1000,
     approveDeploy:true
   }),/SEO F142/);
   assert.equal(a.seen.length,0);
 }));
});
