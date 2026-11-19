import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('../scripts/review-canonical-target-http-offline.mjs',import.meta.url));
const checkout=fileURLToPath(new URL('../',import.meta.url));
const input=status=>({
 schema:'imagine.seo.canonical-target-http-evidence.v1',
 siteOrigin:'https://example.test',
 pageEvidence:{sourceType:'operator_supplied_public_html_metadata_unverified',
  observations:[{pageUrl:'https://example.test/en-us',pageStatus:200,
   canonicalHref:'https://example.test/en-us.html'}]},
 targetEvidence:{sourceType:'operator_supplied_independent_public_http_get_unverified',
  observations:[{targetUrl:'https://example.test/en-us.html',status}]}
});
function run(path,env={}){
 return spawnSync(process.execPath,[cli,path],{
  encoding:'utf8',timeout:9000,cwd:tmpdir(),
  env:{...process.env,GITHUB_ACTIONS:'false',
   IMAGINE_SEO_CANONICAL_REVIEW:'1',...env}
 });
}
function temp(callback){
 const folder=mkdtempSync(join(tmpdir(),'imagine-seo-f216-private-'));
 try{return callback(folder)}finally{rmSync(folder,{recursive:true,force:true})}
}
test('F216 operator reports only indices and counts; HTTP 302 is blocked',()=>temp(folder=>{
 const file=join(folder,'evidence.json');
 writeFileSync(file,JSON.stringify(input(302)),{mode:0o600});
 const p=run(file);
 assert.equal(p.status,1,p.stderr);
 assert.equal(p.stderr,'');
 const data=JSON.parse(p.stdout);
 assert.equal(data.reviewStatus,'blocked');
 assert.equal(data.summary.redirectedCanonicalDeclarations,1);
 assert.deepEqual(data.diagnostics,[{pageIndex:0,code:'canonical_target_redirect'}]);
 assert.doesNotMatch(p.stdout,/example\.test|en-us|evidence\.json|private/);
}));
test('F216 HTTP 200 still exits with a manual-review nonzero result',()=>temp(folder=>{
 const file=join(folder,'ok.json');
 writeFileSync(file,JSON.stringify(input(200)),{mode:0o600});
 const p=run(file);
 assert.equal(p.status,1,p.stderr);
 const data=JSON.parse(p.stdout);
 assert.equal(data.reviewStatus,'human_editorial_http_review_required');
 assert.equal(data.releaseAuthorized,false);
 assert.equal(data.redirectsAuthorized,0);
}));
test('F216 requires explicit operator flag and never accepts GitHub Actions',()=>temp(folder=>{
 const file=join(folder,'evidence.json');
 writeFileSync(file,JSON.stringify(input(200)),{mode:0o600});
 for(const env of [{IMAGINE_SEO_CANONICAL_REVIEW:'0'},{GITHUB_ACTIONS:'true'}]){
  const p=run(file,env);
  assert.equal(p.status,2);
  assert.equal(p.stdout,'');
  assert.match(p.stderr,/HOLD/);
  assert.doesNotMatch(p.stderr,/evidence\.json|example\.test/);
 }
}));
test('F216 rejects symlink, JSON inside checkout and malformed JSON without echo',()=>temp(folder=>{
 const file=join(folder,'evidence.json'),link=join(folder,'alias.json');
 writeFileSync(file,JSON.stringify(input(200)),{mode:0o600});
 symlinkSync(file,link);
 for(const path of [link,join(checkout,'package.json')]){
  const p=run(path);
  assert.equal(p.status,2);
  assert.equal(p.stdout,'');
  assert.match(p.stderr,/HOLD/);
 }
 writeFileSync(file,'{"private":"SECRET_MARKER",}',{mode:0o600});
 const p=run(file);
 assert.equal(p.status,2);
 assert.equal(p.stdout,'');
 assert.doesNotMatch(p.stderr,/SECRET_MARKER|evidence\.json|imagine-seo-f216/);
}));
test('F216 rejects any extra CLI argument without accessing input',()=>temp(folder=>{
 const file=join(folder,'missing.json');
 const p=spawnSync(process.execPath,[cli,file,'--approve-release'],{
  encoding:'utf8',timeout:9000,cwd:tmpdir(),
  env:{...process.env,GITHUB_ACTIONS:'false',IMAGINE_SEO_CANONICAL_REVIEW:'1'}
 });
 assert.equal(p.status,2);
 assert.equal(p.stdout,'');
 assert.match(p.stderr,/HOLD/);
}));
