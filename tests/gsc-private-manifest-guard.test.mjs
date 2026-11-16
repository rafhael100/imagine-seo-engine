import test from 'node:test';
import assert from 'node:assert/strict';
import {
 mkdtemp,mkdir,writeFile,readFile,stat,chmod,symlink,rm,access
} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const fixtureTool=fileURLToPath(new URL(
 '../labs/seo-f144-nginx/create-synthetic-fixture.mjs',import.meta.url));
const cli=fileURLToPath(new URL(
 '../scripts/propose-private-gsc-astro-redirects.mjs',import.meta.url));
const run=(source,build,out)=>spawnSync(process.execPath,
 [cli,source,build,out],{encoding:'utf8',timeout:20000});
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),'seo-f193-'));
 try{
  const gen=spawnSync(process.execPath,[fixtureTool,dir],{
   encoding:'utf8',timeout:15000
  });
  assert.equal(gen.status,0,gen.stderr);
  await fn({
   dir,source:join(dir,'gsc-private.json'),build:join(dir,'dist'),
   proposed:join(dir,'301-proposed-private.json')
  });
 }finally{await rm(dir,{recursive:true,force:true})}
}
test('F193 permits only private 0600 manifest outside checkout and returns HOLD',async()=>{
 await fixture(async({dir,source,build,proposed})=>{
  assert.equal((await stat(dir)).mode&0o777,0o700);
  assert.equal((await stat(source)).mode&0o777,0o600);
  const result=run(source,build,proposed);
  assert.equal(result.status,1,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.manifestWrittenToPrivateLocalFile,true);
  assert.equal(report.publicationAuthorized,false);
  assert.equal(report.liveHttpRedirectsVerified,false);
  assert.equal((await stat(proposed)).mode&0o777,0o600);
  const plan=JSON.parse(await readFile(proposed,'utf8'));
  assert.equal(plan.candidates.length,1);
  assert.equal(plan.candidates[0].status,301);
  assert.doesNotMatch(result.stdout,/example\.test|\/tmp\/|gsc-private/);
  const second=run(source,build,proposed);
  assert.equal(second.status,2);
  assert.equal(second.stdout,'');
  assert.doesNotMatch(second.stderr,/\/tmp\/|gsc-private|example\.test/);
 });
});
test('F193 refuses to write any 301 manifest when GSC PAGE is paginated',async()=>{
 await fixture(async({source,build,proposed})=>{
  const input=JSON.parse(await readFile(source,'utf8'));
  input.hasMore=true;
  await writeFile(source,JSON.stringify(input),{mode:0o600});
  const result=run(source,build,proposed);
  assert.equal(result.status,1,result.stderr);
  const safe=JSON.parse(result.stdout);
  assert.equal(safe.paginationIncomplete,true);
  assert.equal(safe.proposedHostSchemeOnly301s,null);
  assert.equal(safe.manifestWrittenToPrivateLocalFile,false);
  await assert.rejects(access(proposed));
 });
});
test('F193 refuses private 301 output beneath a Git checkout even with 0700 folder',async()=>{
 await fixture(async({dir,source,build})=>{
  const project=join(dir,'untrusted-repo');
  const privateOut=join(project,'private');
  await mkdir(join(project,'.git'),{recursive:true,mode:0o700});
  await mkdir(privateOut,{mode:0o700});
  const target=join(privateOut,'301-not-allowed.json');
  const result=run(source,build,target);
  assert.equal(result.status,2);
  assert.equal(result.stdout,'');
  await assert.rejects(access(target));
 });
});
test('F193 refuses GSC source stored beneath Git even if file permissions are 0600',async()=>{
 await fixture(async({dir,source,build,proposed})=>{
  const project=join(dir,'repository');
  const privateSrc=join(project,'input');
  await mkdir(join(project,'.git'),{recursive:true,mode:0o700});
  await mkdir(privateSrc,{mode:0o700});
  const bad=join(privateSrc,'gsc.json');
  await writeFile(bad,await readFile(source),{mode:0o600});
  const result=run(bad,build,proposed);
  assert.equal(result.status,2);
  assert.equal(result.stdout,'');
  await assert.rejects(access(proposed));
 });
});
test('F193 refuses public directory, public source, symlink path and symlinked build',async()=>{
 await fixture(async({dir,source,build,proposed})=>{
  await chmod(source,0o644);
  let result=run(source,build,proposed);
  assert.equal(result.status,2);
  await chmod(source,0o600);
  await chmod(dir,0o755);
  result=run(source,build,proposed);
  assert.equal(result.status,2);
  await chmod(dir,0o700);
  const link=join(tmpdir(),'seo-f193-link-'+String(process.pid));
  // The input parent itself is a symlink; no status, filename or URL leaks.
  try{
   await symlink(dir,link);
   result=run(join(link,'gsc-private.json'),build,proposed);
   assert.equal(result.status,2);
  }finally{await rm(link,{force:true})}
  const buildLink=join(dir,'symlinked-dist');
  await symlink(build,buildLink);
  result=run(source,buildLink,proposed);
  assert.equal(result.status,2);
  await assert.rejects(access(proposed));
 });
});
