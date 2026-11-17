import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewNginxLoopbackSeoMetadata as review}
 from '../labs/seo-f201-served-metadata/review-served-seo-metadata.mjs';

const ROBOTS='User-agent: *\nAllow: /\nSitemap: https://imaginecomunicacao.com.br/sitemap.xml\n';
const SITEMAP='<urlset><url><loc>https://imaginecomunicacao.com.br/</loc></url></urlset>';
async function fixture(fn,{badSitemap=false,badRobots=false,missingSitemap=false,slowRobots=false}={}){
 const root=await mkdtemp(join(tmpdir(),'seo-f201-'));
 const seen=[];
 try{
  await writeFile(join(root,'robots.txt'),ROBOTS);
  if(!missingSitemap)await writeFile(join(root,'sitemap.xml'),SITEMAP);
  const server=http.createServer((req,res)=>{
   seen.push({
    method:req.method,route:req.url,
    host:req.headers.host,proto:req.headers['x-forwarded-proto']
   });
   if(req.url==='/robots.txt'){
    if(slowRobots){
     res.writeHead(200,{'Content-Type':'text/plain'});
     // Send frequent progress bytes for longer than the total request budget.
     let count=0;
     const id=setInterval(()=>{
      if(++count>30){clearInterval(id);res.end();return;}
      res.write('R');
     },30);
     res.on('close',()=>clearInterval(id));
     return;
    }
    if(badRobots){
     res.writeHead(302,{Location:'https://unrelated.invalid/'});
     res.end();return;
    }
    res.writeHead(200,{'Content-Type':'text/plain'});
    res.end(ROBOTS);return;
   }
   if(req.url==='/sitemap.xml'){
    res.writeHead(200,{'Content-Type':'application/xml'});
    res.end(badSitemap?SITEMAP+'<!-- STALE -->':SITEMAP);
    return;
   }
   res.writeHead(404);res.end();
  });
  await new Promise((ok,fail)=>{
   server.once('error',fail);
   server.listen(0,'127.0.0.1',ok);
  });
  try{
   const port=server.address().port;
   return await fn({root,port,seen});
  }finally{await new Promise(done=>server.close(done));}
 }finally{await rm(root,{recursive:true,force:true});}
}
async function env(fn){
 const a=process.env.APP_ENV,b=process.env.SEO_F138_LOOPBACK_STAGING;
 process.env.APP_ENV='testing';
 process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
 try{return await fn();}
 finally{
  if(a===undefined)delete process.env.APP_ENV;else process.env.APP_ENV=a;
  if(b===undefined)delete process.env.SEO_F138_LOOPBACK_STAGING;
  else process.env.SEO_F138_LOOPBACK_STAGING=b;
 }
}
test('F201 compares TWO real loopback GETs byte-for-byte to staged SEO files',async()=>{
 await fixture(a=>env(async()=>{
  const x=await review({buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200});
  assert.equal(x.reviewStatus,'human_live_static_metadata_review_required');
  assert.equal(x.checkedLocalMetadataFiles,2);
  assert.equal(x.actualLoopbackHttpGetRequests,2);
  assert.equal(x.byteIdenticalServedMetadataFiles,2);
  assert.equal(x.deploymentAuthorized,false);
  assert.equal(x.publicRobotsIndexingAuthorized,false);
  assert.deepEqual(a.seen.map(y=>y.route),['/robots.txt','/sitemap.xml']);
  for(const request of a.seen){
   assert.equal(request.method,'GET');
   assert.equal(request.host,'imaginecomunicacao.com.br');
   assert.equal(request.proto,'https');
  }
  assert.doesNotMatch(JSON.stringify(x),/imaginecomunicacao\.com\.br|STALE|https:\/\//);
 }));
});
test('F201 fails closed when Nginx serves older sitemap bytes',async()=>{
 await fixture(a=>env(async()=>{
  const x=await review({buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200});
  assert.equal(x.reviewStatus,'blocked');
  assert.equal(x.byteIdenticalServedMetadataFiles,1);
  assert.deepEqual(x.blockedComponents,['sitemap_metadata_mismatch']);
  assert.equal(x.publicationAuthorized,false);
 }),{badSitemap:true});
});
test('F201 rejects unexpected robots HTTP redirect without following it',async()=>{
 await fixture(a=>env(async()=>{
  const x=await review({buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200});
  assert.equal(x.reviewStatus,'blocked');
  assert.deepEqual(x.blockedComponents,['robots_metadata_mismatch']);
  assert.equal(a.seen.length,2);
 }),{badRobots:true});
});
test('F201 refuses missing local metadata before contacting loopback',async()=>{
 await fixture(a=>env(async()=>{
  await assert.rejects(
   review({buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200}));
  assert.equal(a.seen.length,0);
 }),{missingSitemap:true});
});
test('F201 rejects missing testing authorization before any GET',async()=>{
 await fixture(async a=>{
  const old=process.env.SEO_F138_LOOPBACK_STAGING;
  delete process.env.SEO_F138_LOOPBACK_STAGING;
  try{
   await assert.rejects(review({
    buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200
   }));
   assert.equal(a.seen.length,0);
  }finally{
   if(old!==undefined)process.env.SEO_F138_LOOPBACK_STAGING=old;
  }
 });
});
test('F201 rejects symlinked robots file without issuing an HTTP request',async()=>{
 await fixture(a=>env(async()=>{
  const {unlink}=await import('node:fs/promises');
  await unlink(join(a.root,'robots.txt'));
  await symlink(join(a.root,'sitemap.xml'),join(a.root,'robots.txt'));
  await assert.rejects(review({
   buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200
  }));
  assert.equal(a.seen.length,0);
 }));
});

test('F202 fails closed when byte trickle defeats idle socket timeouts',async()=>{
 await fixture(a=>env(async()=>{
  await assert.rejects(
   review({buildDirectory:a.root,stagingPort:a.port,timeoutMs:260}),
   /isolated HTTP GET refused/
  );
  assert.deepEqual(a.seen.map(r=>r.route),['/robots.txt']);
 }),{slowRobots:true});
});
