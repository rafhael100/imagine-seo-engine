import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {captureLoopbackStaging301} from
  '../labs/seo-f138-loopback/loopback-capture.mjs';
import {attestLocalStagingBuild} from
  '../labs/seo-f140-build-attestation/verify-loopback-build.mjs';
import {reviewLoopbackServedHtmlParity} from
  '../labs/seo-f142-body-parity/review-loopback-served-html.mjs';
import {fingerprintCompiledSite} from '../src/compiled-site-fingerprint.mjs';

const HOME='<!doctype html><html><head><title>Original</title></head><body>Exact local fixture content for bounded HTTP verification.</body></html>';
const EN='<!doctype html><html><head><title>English</title></head><body>Second local target.</body></html>';
const manifest=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:'https://example.test/',
  legacyUrls:['http://www.example.test/'],
  targetRoutes:['/','/en/'],
  candidates:[{fromUrl:'http://www.example.test/',toPath:'/',status:301}]
});
async function staging(fn){
  const old={APP_ENV:process.env.APP_ENV,
    SEO_F138_LOOPBACK_STAGING:process.env.SEO_F138_LOOPBACK_STAGING};
  process.env.APP_ENV='testing';
  process.env.SEO_F138_LOOPBACK_STAGING='YES_I_CONTROL_THIS_LOOPBACK';
  try{return await fn();}
  finally{for(const [key,value] of Object.entries(old)){
    if(value===undefined)delete process.env[key];
    else process.env[key]=value;
  }}
}
async function build(fn){
  const root=await mkdtemp(join(tmpdir(),'seo-f203-'));
  try{
    await mkdir(join(root,'en'));
    await writeFile(join(root,'index.html'),HOME);
    await writeFile(join(root,'en','index.html'),EN);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\n');
    await writeFile(join(root,'sitemap.xml'),
      '<urlset><url><loc>https://example.test/</loc></url><url><loc>https://example.test/en/</loc></url></urlset>');
    return await fn(root);
  }finally{await rm(root,{recursive:true,force:true});}
}
async function listen(server){
  await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
  return server.address().port;
}
// Real bytes keep the socket active, but the final CRLF is intentionally late.
// The complete response is valid, so the previous idle-only implementation
// would eventually succeed rather than reject for an unrelated parse error.
async function withSlowHeaders(kind,digest,fn){
  const sockets=new Set(),timers=new Set(),seen=[];
  const server=net.createServer(socket=>{
    sockets.add(socket);
    let request='',started=false,timer;
    socket.on('error',()=>{});
    socket.on('close',()=>{
      sockets.delete(socket);
      clearInterval(timer);timers.delete(timer);
    });
    socket.on('data',chunk=>{
      if(started)return;
      request+=chunk.toString('ascii');
      if(!request.includes('\r\n\r\n'))return;
      started=true;seen.push(request);
      const old=/\r\nhost:\s*www\.example\.test\r\n/i.test(request);
      const status=kind==='redirect'&&old?'301 Moved Permanently':'200 OK';
      const header=kind==='redirect'&&old?
        'Location: https://example.test/\r\n':
        kind==='digest'?'X-Imagine-SEO-Build-SHA256: '+digest+'\r\n':'';
      const prefix='HTTP/1.1 '+status+'\r\n'+header+
        'Content-Length: 0\r\nConnection: close\r\n';
      if(seen.length>1){socket.end(prefix+'\r\n');return;}
      socket.write(prefix+'X-Progress: ');
      let count=0;
      timer=setInterval(()=>{
        if(++count<=40){socket.write('x');return;}
        clearInterval(timer);timers.delete(timer);
        socket.end('\r\n\r\n');
      },20);
      timers.add(timer);
    });
  });
  const port=await listen(server);
  try{return await fn({port,seen});}
  finally{
    for(const timer of timers)clearInterval(timer);
    for(const socket of sockets)socket.destroy();
    await new Promise(ok=>server.close(ok));
  }
}
async function withSlowHtml(fn){
  const seen=[],timers=new Set();
  const server=http.createServer((req,res)=>{
    seen.push({method:req.method,path:req.url});
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    if(req.url!=='/'){res.end(EN);return;}
    let offset=0;
    const timer=setInterval(()=>{
      if(offset>=HOME.length){
        clearInterval(timer);timers.delete(timer);res.end();return;
      }
      res.write(HOME.slice(offset,offset+4));offset+=4;
    },30);
    timers.add(timer);
    res.on('close',()=>{clearInterval(timer);timers.delete(timer);});
  });
  const port=await listen(server);
  try{return await fn({port,seen});}
  finally{
    for(const timer of timers)clearInterval(timer);
    server.closeAllConnections();
    await new Promise(ok=>server.close(ok));
  }
}
test('F203 HEAD redirect capture rejects continuously arriving late headers',async()=>{
  await withSlowHeaders('redirect',null,a=>staging(async()=>{
    await assert.rejects(captureLoopbackStaging301({
      migrationInput:manifest(),stagingPort:a.port,timeoutMs:260
    }),/^Error: SEO F138: local staging request failed$/);
    assert.equal(a.seen.length,1,'no canonical follow-up after the deadline');
  }));
});
test('F203 build attestation rejects late headers even with the exact local digest',async()=>{
  await build(async root=>{
    const digest=(await fingerprintCompiledSite(root)).sha256;
    await withSlowHeaders('digest',digest,a=>staging(async()=>{
      await assert.rejects(attestLocalStagingBuild({
        migrationInput:manifest(),buildDirectory:root,
        stagingPort:a.port,timeoutMs:260
      }),/^Error: SEO F140: isolated local probe failed$/);
      assert.equal(a.seen.length,1);
    }));
  });
});
test('F203 HTML parity rejects a slow exact body before probing the next route',async()=>{
  await build(root=>withSlowHtml(a=>staging(async()=>{
    await assert.rejects(reviewLoopbackServedHtmlParity({
      migrationInput:manifest(),buildDirectory:root,
      stagingPort:a.port,timeoutMs:260
    }),/^Error: SEO F142: local HTML GET failed$/);
    assert.deepEqual(a.seen,[{method:'GET',path:'/'}]);
  })));
});
