import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cli=fileURLToPath(new URL(
 '../scripts/review-two-comercial-portal-readiness-builds.mjs',import.meta.url
));
const LOCALES=[
 ['index.html','contratação pública ainda não está disponível'],
 ['en/index.html','Public checkout is not available'],
 ['es/index.html','No existe checkout público']
];
const exec=(args,cwd)=>execFileSync('git',args,{
 cwd,encoding:'utf8',stdio:['ignore','pipe','ignore']
}).trim();
function html(marker,after){
 const notice=after?'<p data-choice-portal-readiness '+
  'data-code="private_single_preview_only" aria-live="polite">'+
  marker+'</p>':'';
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
  '<title>Independent commercial reviewed source fixture</title></head>'+
  '<body><h1>Independent valid static customer choice</h1>'+
  '<section><p>Checkout availability must be communicated honestly and '+
  'reviewed before connecting any portal identity or payment service.</p>'+
  notice+'</section></body></html>';
}
function gitRepo(root,name,after){
 const path=join(root,name);
 mkdirSync(path,{recursive:true});
 exec(['init','-q'],path);
 exec(['config','user.email','qa@example.invalid'],path);
 exec(['config','user.name','Imagine QA'],path);
 const dist=join(path,'dist');
 mkdirSync(join(dist,'en'),{recursive:true});
 mkdirSync(join(dist,'es'),{recursive:true});
 for(const [relative,notice] of LOCALES)
  writeFileSync(join(dist,relative),html(notice,after));
 exec(['add','.'],path);
 exec(['commit','-qm',after?'after':'before'],path);
 return {dist,sha:exec(['rev-parse','HEAD'],path)};
}
const run=(a,b,sa,sb)=>spawnSync(process.execPath,
 [cli,a,b,sa,sb],{encoding:'utf8',timeout:15000});
test('F195 requires two real immutable Git checkouts with both exact heads',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seo-f195-'));
 try{
  const before=gitRepo(dir,'before',false);
  const after=gitRepo(dir,'after',true);
  assert.notEqual(before.sha,after.sha);
  const outcome=run(before.dist,after.dist,before.sha,after.sha);
  assert.equal(outcome.status,0,outcome.stderr);
  const r=JSON.parse(outcome.stdout);
  assert.equal(r.realPublicAstroLanguagesAudited,3);
  assert.equal(r.independentGitCheckoutHeadsVerified,true);
  assert.equal(r.pinnedBeforeRevisionVerified,true);
  assert.equal(r.pinnedAfterRevisionVerified,true);
  assert.equal(r.outputHtmlCryptographicallyAttested,false);
  assert.equal(r.publicCheckoutAuthorized,false);
  assert.doesNotMatch(outcome.stdout,/\/tmp\/|qa@example|PRIVATE/);
  const wrong=run(before.dist,after.dist,after.sha,before.sha);
  assert.equal(wrong.status,1);
  assert.equal(wrong.stdout,'');
  assert.doesNotMatch(wrong.stderr,/\/tmp\/|qa@example/);
  const reused=run(after.dist,after.dist,before.sha,after.sha);
  assert.equal(reused.status,1);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('F195 refuses symlink aliases even if the HTML content and SHA look legitimate',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seo-f195-link-'));
 try{
  const before=gitRepo(dir,'before',false);
  const after=gitRepo(dir,'after',true);
  const link=join(dir,'build-alias');
  symlinkSync(after.dist,link,'dir');
  const result=run(before.dist,link,before.sha,after.sha);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
 }finally{rmSync(dir,{recursive:true,force:true})}
});
