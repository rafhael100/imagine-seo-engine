import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {captureLoopbackStaging301} from
  '../labs/seo-f138-loopback/loopback-capture.mjs';
import {reviewLoopbackServedHtmlParity} from
  '../labs/seo-f142-body-parity/review-loopback-served-html.mjs';
import {reviewNginxLoopbackSeoMetadata} from
  '../labs/seo-f201-served-metadata/review-served-seo-metadata.mjs';

const HOME='<!doctype html><html><head><title>Exact fixture</title></head><body>Local body</body></html>';
const ROBOTS='User-agent: *\nAllow: /\nSitemap: https://imaginecomunicacao.com.br/sitemap.xml\n';
const SITEMAP='<urlset><url><loc>https://imaginecomunicacao.com.br/</loc></url></urlset>';
const manifest=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:'https://example.test/',
  legacyUrls:['http://www.example.test/'],targetRoutes:['/'],
  candidates:[{fromUrl:'http://www.example.test/',toPath:'/',status:301}]
});
async function staging(fn){
  const old={APP_ENV:process.env.APP_ENV,
    SEO_F138_LOOPBACK_STAGING:process.env.SEO_F138_LOOPBACK_STAGING};
  process.env.APP_ENV='testing';
  process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
  try{return await fn();}
  finally{for(const [key,value] of Object.entries(old)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }}
}
async function fixture(handler,fn){
  const root=await mkdtemp(join(tmpdir(),'seo-f204-'));
  const seen=[];
  const server=http.createServer((req,res)=>{
    seen.push({method:req.method,path:req.url});
    handler(req,res);
  });
  try{
    await writeFile(join(root,'index.html'),HOME);
    await writeFile(join(root,'robots.txt'),ROBOTS);
    await writeFile(join(root,'sitemap.xml'),SITEMAP);
    await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
    return await fn({root,port:server.address().port,seen});
  }finally{
    server.closeAllConnections();
    if(server.listening)await new Promise(ok=>server.close(ok));
    await rm(root,{recursive:true,force:true});
  }
}
for(const duplicate of ['https://other.invalid/private','https://example.test/']){
  test('F204 redirect capture rejects duplicate Location: '+(duplicate.includes('other')?'conflicting':'identical'),async()=>{
    await fixture((req,res)=>{
      if(req.headers.host==='www.example.test'){
        res.writeHead(301,['Location','https://example.test/','lOcAtIoN',duplicate]);
      }else res.writeHead(200);
      res.end();
    },a=>staging(async()=>{
      await assert.rejects(captureLoopbackStaging301({
        migrationInput:manifest(),stagingPort:a.port,timeoutMs:1200
      }),/^Error: SEO F138: ambiguous Location header$/);
      assert.deepEqual(a.seen,[{method:'HEAD',path:'/'}]);
    }));
  });
}
test('F204 HTML parity blocks duplicate mixed-case Content-Type despite exact bytes',async()=>{
  await fixture((req,res)=>{
    res.writeHead(200,['Content-Type','text/html','cOnTeNt-TyPe','text/plain']);
    res.end(HOME);
  },a=>staging(async()=>{
    const result=await reviewLoopbackServedHtmlParity({
      migrationInput:manifest(),buildDirectory:a.root,
      stagingPort:a.port,timeoutMs:1200
    });
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.unexpectedContentType,1);
    assert.equal(result.summary.identicalHtmlResponses,0);
    assert.deepEqual(result.failureIndices,[{
      targetRouteIndex:0,code:'non_html_content_type'
    }]);
    assert.equal(result.publicationAuthorized,false);
    assert.doesNotMatch(JSON.stringify(result),/text\/plain|example\.test|Exact fixture/);
  }));
});
for(const target of ['robots','sitemap']){
  test('F204 '+target+' blocks duplicate Content-Type with byte-identical metadata',async()=>{
    await fixture((req,res)=>{
      const robots=req.url==='/robots.txt';
      const type=robots?'text/plain':'application/xml';
      const duplicate=target===(robots?'robots':'sitemap');
      res.writeHead(200,duplicate?
        ['Content-Type',type,'CONTENT-TYPE','application/octet-stream']:
        ['Content-Type',type]);
      res.end(robots?ROBOTS:SITEMAP);
    },a=>staging(async()=>{
      const result=await reviewNginxLoopbackSeoMetadata({
        buildDirectory:a.root,stagingPort:a.port,timeoutMs:1200
      });
      assert.equal(result.reviewStatus,'blocked');
      assert.deepEqual(result.blockedComponents,[target+'_metadata_mismatch']);
      assert.equal(result.byteIdenticalServedMetadataFiles,1);
      assert.equal(result.publicationAuthorized,false);
      assert.doesNotMatch(JSON.stringify(result),/octet-stream|imaginecomunicacao/);
    }));
  });
}
