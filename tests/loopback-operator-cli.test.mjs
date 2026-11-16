import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL(
  '../labs/seo-f138-loopback/review-private-loopback-cli.mjs',import.meta.url
));
function manifest(){
  return {
    sourceType:'operator_supplied_legacy_urls_unverified',
    siteDomain:'example.test',
    canonicalOrigin:'https://example.test/',
    legacyUrls:['http://www.example.test/'],
    targetRoutes:['/'],
    candidates:[
      {fromUrl:'http://www.example.test/',toPath:'/',status:301}
    ]
  };
}
async function spawnCli(file,optIn=true){
  return await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[script,file],{
      env:{...process.env,SEO_F138_ALLOW_LOCAL_HEAD:optIn?'1':'0'},
      stdio:['ignore','pipe','pipe']
    });
    let stdout='',stderr='';
    const timeout=setTimeout(()=>child.kill('SIGKILL'),12000);
    child.stdout.on('data',part=>stdout+=part);
    child.stderr.on('data',part=>stderr+=part);
    child.once('error',e=>{clearTimeout(timeout);reject(e);});
    child.once('close',code=>{
      clearTimeout(timeout);
      resolve({status:code,stdout,stderr});
    });
  });
}
async function fixture(handler,fn){
  const server=createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const folder=await mkdtemp(join(tmpdir(),'seo-f139-'));
  const file=join(folder,'private-http-migration.json');
  const data={migrationInput:manifest(),loopbackPort:server.address().port};
  await writeFile(file,JSON.stringify(data),{mode:0o600});
  try{await fn({file,folder,data});}
  finally{
    await rm(folder,{recursive:true,force:true});
    await new Promise(resolve=>server.close(resolve));
  }
}
test('F139 CLI issues actual loopback HEAD and returns strictly sanitized report',async()=>{
  const methods=[],hosts=[];
  await fixture((req,res)=>{
    methods.push(req.method);hosts.push(req.headers.host);
    if(req.headers.host==='www.example.test')
      res.writeHead(301,{Location:'https://example.test/'}).end();
    else if(req.headers.host==='example.test')
      res.writeHead(200).end();
    else res.writeHead(404).end();
  },async({file})=>{
    const out=await spawnCli(file);
    assert.equal(out.status,0,out.stderr);
    assert.equal(out.stderr,'');
    const report=JSON.parse(out.stdout);
    assert.equal(report.reviewStatus,'human_http_staging_review_required');
    assert.equal(report.summary.matched301ToCanonical,1);
    assert.equal(report.publicInternetRequested,false);
    assert.equal(report.publicationAuthorized,false);
    for(const secret of ['example.test','http://','https://','private-http'])
      assert.equal((out.stdout+out.stderr).includes(secret),false,secret);
  });
  assert.deepEqual(methods,['HEAD','HEAD']);
  assert.deepEqual(hosts,['www.example.test','example.test']);
});
test('F139 exit 2 for 302 and refuses any external redirect follow',async()=>{
  const requests=[];
  await fixture((req,res)=>{
    requests.push(req.url);
    res.writeHead(302,{Location:'https://evil.test/private?token=secret'}).end();
  },async({file})=>{
    const out=await spawnCli(file);
    assert.equal(out.status,2,out.stderr);
    assert.equal(out.stderr,'');
    assert.equal(JSON.parse(out.stdout).reviewStatus,'blocked');
    assert.doesNotMatch(out.stdout,/evil.test|token=secret/);
  });
  assert.equal(requests.length,1);
});
test('F139 exit 1 without operator opt-in, for symlink or invalid JSON',async()=>{
  await fixture((req,res)=>res.writeHead(200).end(),async({file,folder})=>{
    const without=await spawnCli(file,false);
    assert.equal(without.status,1);
    assert.equal(without.stdout,'');
    assert.equal(without.stderr,
      'SEO F139: unsafe or unavailable approved local HEAD review\n');
    const alias=join(folder,'linked.json');
    await symlink(file,alias);
    const linked=await spawnCli(alias);
    assert.equal(linked.status,1);
    assert.equal(linked.stdout,'');
    await writeFile(file,'{"private":"malformed');
    const malformed=await spawnCli(file);
    assert.equal(malformed.status,1);
    assert.equal(malformed.stdout,'');
    assert.equal(malformed.stderr,
      'SEO F139: unsafe or unavailable approved local HEAD review\n');
  });
});
