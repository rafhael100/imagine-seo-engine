import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,rm,writeFile,symlink,chmod,mkdir,access} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderIsolatedNginxStagingConfig as render} from
  '../labs/seo-f145-nginx-render/render-staging-config.mjs';
const fixtureGenerator=fileURLToPath(new URL(
 '../labs/seo-f144-nginx/create-synthetic-fixture.mjs',import.meta.url
));
const cli=fileURLToPath(new URL(
 '../scripts/render-private-nginx-staging-config.mjs',import.meta.url
));
function execute(script,args){
 return spawnSync(process.execPath,[script,...args],{
  encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024
 });
}
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),'seo-f145-'));
 try{
  const gen=execute(fixtureGenerator,[dir]);
  assert.equal(gen.status,0,gen.stderr);
  const planPath=join(dir,'legacy-private.json');
  const build=join(dir,'dist');
  const plan=JSON.parse(await readFile(planPath,'utf8'));
  await fn({dir,planPath,build,plan});
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('F145 builds strict private Nginx map after verifying real HTML',async()=>{
 await fixture(async({plan,build})=>{
  const out=await render({migrationInput:plan,buildDirectory:build});
  assert.equal(out.review.reviewStatus,'human_staging_proxy_review_required');
  assert.equal(out.review.redirectsRendered,2);
  assert.equal(out.review.compiledTargetRoutes,2);
  assert.equal(out.review.networkPerformed,false);
  assert.equal(out.review.productionReleaseAuthorized,false);
  assert.match(out.digest,/^[a-f0-9]{64}$/);
  assert.ok(out.privateConfig.includes(
    '"http|www.example.test|/" "https://example.test/";'));
  assert.ok(out.privateConfig.includes(
    '"https|www.example.test|/en-us/" "https://example.test/en/";'));
  assert.ok(out.privateConfig.includes(
    'if ($seo_f145_allowed_origin = 0) { return 444; }'));
  assert.ok(out.privateConfig.includes(
    'X-Imagine-SEO-Build-SHA256 "'+out.digest+'"'));
  assert.doesNotMatch(JSON.stringify(out.review),/example\.test|https:\/\//);
 });
});
test('F145 operator CLI stores config outside Git and redacts stdout',async()=>{
 await fixture(async({planPath,build,dir})=>{
  const conf=join(dir,'operator-private-nginx.conf');
  const result=execute(cli,[
   '--manifest',planPath,'--build',build,'--out',conf
  ]);
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.redirectsRendered,2);
  assert.equal(report.productionReleaseAuthorized,false);
  assert.doesNotMatch(result.stdout,/example\.test|nginx\.conf|https:\/\//);
  assert.match(await readFile(conf,'utf8'),/X-Imagine-SEO-Build-SHA256/);
  const perm=await stat(conf);
  assert.equal(perm.mode&0o777,0o644);
  const again=execute(cli,[
   '--manifest',planPath,'--build',build,'--out',conf
  ]);
  assert.equal(again.status,1);
  assert.equal(again.stdout,'');
  assert.equal(again.stderr,
    'SEO F145: private Nginx staging config rejected or failed\n');
 });
});
test('F145 rejects extra authority, unsafe routes and missing real compiled target',async()=>{
 await fixture(async({plan,build})=>{
  await assert.rejects(render({
    migrationInput:{...plan,autoDeploy:true},buildDirectory:build
  }),/SEO F127/);
  const unsafe=structuredClone(plan);
  unsafe.legacyUrls.push('http://www.example.test/UPPER/');
  unsafe.candidates.push({
   fromUrl:'http://www.example.test/UPPER/',
   toPath:'/',status:301
  });
  await assert.rejects(render({migrationInput:unsafe,buildDirectory:build}),/SEO F145/);
  const missing=structuredClone(plan);
  missing.targetRoutes.push('/does-not-exist/');
  await assert.rejects(render({migrationInput:missing,buildDirectory:build}),/SEO F145/);
 });
});
test('F145 refuses symlinked manifest without generating output',async()=>{
 await fixture(async({planPath,build,dir})=>{
  const symlinkPath=join(dir,'manifest-symlink');
  await symlink(planPath,symlinkPath);
  const out=join(dir,'should-not-exist.conf');
  const result=execute(cli,[
   '--manifest',symlinkPath,'--build',build,'--out',out
  ]);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(result.stderr,
    'SEO F145: private Nginx staging config rejected or failed\n');
 });
});

test('F189 keeps all private staging source material under an operator-only parent',async()=>{
 await fixture(async({dir,planPath,build})=>{
  const parent=await stat(dir);
  assert.equal(parent.mode&0o777,0o700);
  const input=await stat(planPath);
  assert.equal(input.mode&0o777,0o600);
  const output=join(dir,'private-operator-map.conf');
  const result=execute(cli,[
   '--manifest',planPath,'--build',build,'--out',output
  ]);
  assert.equal(result.status,0,result.stderr);
  const written=await stat(output);
  // 0644 is deliberate for an unprivileged uid 101 Nginx bind mount.
  // Its PARENT stays 0700 and is inaccessible to other host users.
  assert.equal(written.mode&0o777,0o644);
  assert.equal((await stat(dir)).mode&0o777,0o700);
 });
});
test('F189 refuses public 0755 input/output directory before creating Nginx config',async()=>{
 await fixture(async({dir,planPath,build})=>{
  await chmod(dir,0o755);
  const output=join(dir,'must-not-write.conf');
  const result=execute(cli,[
   '--manifest',planPath,'--build',build,'--out',output
  ]);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(result.stderr,
   'SEO F145: private Nginx staging config rejected or failed\n');
  await assert.rejects(access(output));
 });
});
test('F189 refuses world-readable manifest even inside private parent',async()=>{
 await fixture(async({dir,planPath,build})=>{
  await chmod(planPath,0o644);
  const output=join(dir,'must-not-write.conf');
  const result=execute(cli,[
   '--manifest',planPath,'--build',build,'--out',output
  ]);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  await assert.rejects(access(output));
 });
});
test('F189 refuses separate unsafe output directory and symlinked directory',async()=>{
 await fixture(async({dir,planPath,build})=>{
  const publicDir=join(dir,'public-output');
  await mkdir(publicDir,{mode:0o755});
  const result=execute(cli,[
   '--manifest',planPath,'--build',build,
   '--out',join(publicDir,'not-private.conf')
  ]);
  assert.equal(result.status,1);
  await assert.rejects(access(join(publicDir,'not-private.conf')));
  const alias=join(dir,'symlinked-output');
  await symlink(dir,alias);
  const symlinkAttempt=execute(cli,[
   '--manifest',planPath,'--build',build,
   '--out',join(alias,'not-private.conf')
  ]);
  assert.equal(symlinkAttempt.status,1);
  await assert.rejects(access(join(dir,'not-private.conf')));
 });
});
