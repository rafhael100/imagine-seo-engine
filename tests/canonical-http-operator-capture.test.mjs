import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {chmodSync,existsSync,mkdtempSync,readFileSync,rmSync,
 writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const collector=fileURLToPath(new URL('../scripts/capture-canonical-http-operator.mjs',import.meta.url));
const reviewCli=fileURLToPath(new URL('../scripts/review-canonical-target-http-offline.mjs',import.meta.url));
const root='https://www.imaginecomunicacao.com.br';
const data=()=>({
 schema:'imagine.seo.canonical-target-http-evidence.v1',siteOrigin:root,
 pageEvidence:{sourceType:'operator_supplied_public_html_metadata_unverified',
  observations:[
   {pageUrl:root+'/en-us',pageStatus:200,canonicalHref:root+'/en-us.html'},
   {pageUrl:root+'/en-us/',pageStatus:200,canonicalHref:root+'/en-us.html'},
   {pageUrl:root+'/sobre',pageStatus:200,canonicalHref:root+'/sobre.html'}
  ]}
});
function workspace(fn){
 const dir=mkdtempSync(join(tmpdir(),'imagine-seo-f218-private-'));
 const input=join(dir,'pages.json'),output=join(dir,'observations.json'),trace=join(dir,'calls.json');
 try{
  writeFileSync(input,JSON.stringify(data()),{mode:0o600});
  return fn({dir,input,output,trace});
 }finally{chmodSync(dir,0o700);rmSync(dir,{recursive:true,force:true});}
}
function run({input,output,trace},overrides={}){
 const preload=[
  "import {writeFileSync} from 'node:fs';",
  "const requests=[];",
  "globalThis.fetch=async(url,opts)=>{",
  " requests.push({url,method:opts.method,redirect:opts.redirect,credentials:opts.credentials,headers:opts.headers,cache:opts.cache});",
  " if(url.endsWith('/en-us.html'))return new Response(null,{status:302,headers:{Location:'/en-us/'}});",
  " return new Response('SYNTHETIC_PAGE_NEVER_SAVED',{status:200,headers:{'content-type':'text/html'}});",
  "};",
  "process.on('exit',()=>writeFileSync("+JSON.stringify(trace)+",JSON.stringify(requests),{mode:0o600}));"
 ].join('\n');
 const p=spawnSync(process.execPath,[
  '--import','data:text/javascript;base64,'+Buffer.from(preload).toString('base64'),
  collector,'--pages',input,'--output',output
 ],{cwd:tmpdir(),encoding:'utf8',timeout:15000,
  env:{...process.env,GITHUB_ACTIONS:'false',IMAGINE_SEO_HTTP_CAPTURE:'1',...overrides}});
 assert.ifError(p.error);
 return p;
}
test('F218 collects exactly two anonymous targets, writes 0600 and reviews blocked 302',()=>workspace(x=>{
 const p=run(x);
 assert.equal(p.status,0,p.stderr);
 assert.equal(p.stderr,'');
 const captured=JSON.parse(readFileSync(x.output,'utf8'));
 assert.equal(captured.targetEvidence.observations.length,2);
 assert.equal(captured.targetEvidence.observations[0].status,302);
 assert.equal(captured.targetEvidence.observations[1].status,200);
 assert.equal(captured.targetEvidence.sourceType,
  'operator_supplied_independent_public_http_get_unverified');
 const calls=JSON.parse(readFileSync(x.trace,'utf8'));
 assert.deepEqual(calls.map(c=>c.url),[root+'/en-us.html',root+'/sobre.html']);
 for(const c of calls){
  assert.equal(c.method,'GET');assert.equal(c.redirect,'manual');
  assert.equal(c.credentials,'omit');assert.deepEqual(c.headers,{Accept:'text/html'});
 }
 assert.doesNotMatch(p.stdout,/en-us|sobre|imaginecomunicacao|private-/);
 assert.doesNotMatch(JSON.stringify(captured),/SYNTHETIC_PAGE_NEVER_SAVED/);
 const checked=spawnSync(process.execPath,[reviewCli,x.output],{
  cwd:tmpdir(),encoding:'utf8',timeout:10000,
  env:{...process.env,GITHUB_ACTIONS:'false',IMAGINE_SEO_CANONICAL_REVIEW:'1'}
 });
 assert.equal(checked.status,1,checked.stderr);
 const result=JSON.parse(checked.stdout);
 assert.equal(result.reviewStatus,'blocked');
 assert.equal(result.summary.redirectedCanonicalDeclarations,2);
 assert.equal(result.summary.redirectedDistinctTargets,1);
}));
test('F218 refuses existing output before any public GET',()=>workspace(x=>{
 writeFileSync(x.output,'SYNTHETIC_EXISTING',{mode:0o600});
 const p=run(x);
 assert.equal(p.status,2);
 assert.equal(readFileSync(x.output,'utf8'),'SYNTHETIC_EXISTING');
 assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
}));
test('F218 refuses disabled opt-in or GitHub Actions before any GET',()=>workspace(x=>{
 for(const env of [{GITHUB_ACTIONS:'true'},{IMAGINE_SEO_HTTP_CAPTURE:'0'}]){
  const p=run(x,env);
  assert.equal(p.status,2);assert.equal(p.stdout,'');
  assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
  assert.equal(existsSync(x.output),false);
 }
}));
test('F218 refuses public directories, non-0600 inputs and final symlinks',()=>workspace(x=>{
 chmodSync(x.dir,0o755);
 let p=run(x);
 assert.equal(p.status,2);
 assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
 chmodSync(x.dir,0o700);
 chmodSync(x.input,0o644);
 p=run(x);assert.equal(p.status,2);
 assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
 chmodSync(x.input,0o600);
 const alias=join(x.dir,'alias.json');symlinkSync(x.input,alias);
 p=run({...x,input:alias});assert.equal(p.status,2);
 assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
}));
test('F218 denies malformed provenance or timeout before any GET',()=>workspace(x=>{
 let p=run(x,{IMAGINE_SEO_HTTP_TIMEOUT_MS:'01000'});
 assert.equal(p.status,2);
 assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
 writeFileSync(x.input,'{"secret":"DO_NOT_LOG"}',{mode:0o600});
 p=run(x);
 assert.equal(p.status,2);
 assert.deepEqual(JSON.parse(readFileSync(x.trace,'utf8')),[]);
 assert.doesNotMatch(p.stderr,/secret|DO_NOT_LOG|pages\.json|imagine-seo-f218/);
}));
