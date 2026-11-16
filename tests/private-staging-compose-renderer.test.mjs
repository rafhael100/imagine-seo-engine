import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,stat,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderIsolatedNginxStagingConfig} from
  '../labs/seo-f145-nginx-render/render-staging-config.mjs';
import {renderPrivateStagingCompose as render} from
  '../labs/seo-f149-compose-render/render-private-compose.mjs';

const fixtureGenerator=fileURLToPath(new URL(
 '../labs/seo-f144-nginx/create-synthetic-fixture.mjs',import.meta.url));
const cli=fileURLToPath(new URL(
 '../scripts/render-private-staging-compose.mjs',import.meta.url));
function inventory(){
 return {
  sourceType:'operator_supplied_docker_host_inventory_unverified',
  requested:{
   composeProject:'seo-f149-private-stage',
   networkName:'seo-f149-private-network',
   volumeName:'seo-f149-reserved-volume',
   loopbackPort:18341,memoryLimitMiB:512,cpuLimit:1
  },
  host:{availableMemoryMiB:16000,totalCpu:8,snapshotComplete:true},
  existing:{
   containerNames:['imagine-crm-web','imagine-sites-preview'],
   networkNames:['crm-network'],volumeNames:['crm-volume'],
   listeningPorts:[18081,18082],publishedPorts:[18081]
  }
 };
}
const spawn=(script,args)=>spawnSync(process.execPath,[script,...args],{
 encoding:'utf8',timeout:20000,maxBuffer:1024*1024
});
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),'seo-f149-'));
 try{
  const created=spawn(fixtureGenerator,[dir]);
  assert.equal(created.status,0,created.stderr);
  const build=join(dir,'dist');
  const planPath=join(dir,'legacy-private.json');
  const plan=JSON.parse(await readFile(planPath,'utf8'));
  const generated=await renderIsolatedNginxStagingConfig({
   migrationInput:plan,buildDirectory:build
  });
  const conf=join(dir,'approved-private-nginx.conf');
  await writeFile(conf,generated.privateConfig,{mode:0o644});
  const inventoryPath=join(dir,'inventory-private.json');
  await writeFile(inventoryPath,JSON.stringify(inventory()),{mode:0o600});
  await fn({dir,build,planPath,plan,conf,inventoryPath});
 }finally{await rm(dir,{force:true,recursive:true});}
}
test('F149 renders one isolated read-only Nginx Compose without deployment',async()=>{
 await fixture(async a=>{
  const result=await render({
   privateInventory:inventory(),migrationInput:a.plan,
   buildDirectory:a.build,nginxConfigPath:a.conf
  });
  assert.equal(result.review.reviewStatus,'human_compose_safety_review_required');
  assert.equal(result.review.deploymentAuthorized,false);
  assert.equal(result.review.vpsChangesApplied,false);
  assert.equal(result.review.noPersistentDockerVolumes,true);
  assert.equal(result.review.imagePinnedByDigest,true);
  assert.equal(result.review.localConfigMatchesAuditedBuild,true);
  assert.match(result.privateCompose,/127\.0\.0\.1:18341:8080/);
  assert.match(result.privateCompose,/read_only: true/);
  assert.match(result.privateCompose,/cap_drop: \["ALL"\]/);
  assert.match(result.privateCompose,/mem_limit: "512m"/);
  assert.match(result.privateCompose,/cpus: "1"/);
  assert.match(result.privateCompose,/seo-f149-private-network/);
  assert.match(result.privateCompose,/sha256:[0-9a-f]{64}/);
  assert.doesNotMatch(result.privateCompose,/network_mode: host|privileged: true/);
  assert.doesNotMatch(JSON.stringify(result.review),/imagine-crm|18341|private-network/);
 });
});
test('F149 rejects modified Nginx config even when build folder is unchanged',async()=>{
 await fixture(async a=>{
  const old=await readFile(a.conf,'utf8');
  await writeFile(a.conf,old.replace('X-Imagine-SEO-Build-SHA256',
    'X-Imagine-SEO-Wrong-SHA256'));
  await assert.rejects(render({
   privateInventory:inventory(),migrationInput:a.plan,
   buildDirectory:a.build,nginxConfigPath:a.conf
  }),/SEO F149/);
 });
});
test('F149 blocks conflicts with CRM and rejects symlinked Nginx conf',async()=>{
 await fixture(async a=>{
  const blocked=inventory();
  blocked.requested.loopbackPort=18081;
  await assert.rejects(render({
   privateInventory:blocked,migrationInput:a.plan,
   buildDirectory:a.build,nginxConfigPath:a.conf
  }),/SEO F149/);
  const alias=join(a.dir,'conf-symlink');
  await symlink(a.conf,alias);
  await assert.rejects(render({
   privateInventory:inventory(),migrationInput:a.plan,
   buildDirectory:a.build,nginxConfigPath:alias
  }),/SEO F149/);
 });
});
test('F149 CLI creates private exclusive Compose file, without leaking names',async()=>{
 await fixture(async a=>{
  const out=join(a.dir,'private-compose.yml');
  const args=[
   '--inventory',a.inventoryPath,
   '--manifest',a.planPath,
   '--build',a.build,
   '--nginx-conf',a.conf,
   '--out',out
  ];
  const p=spawn(cli,args);
  assert.equal(p.status,0,p.stderr);
  const report=JSON.parse(p.stdout);
  assert.equal(report.reviewStatus,'human_compose_safety_review_required');
  assert.equal(report.serviceStarted,false);
  assert.equal(report.dockerCommandsPerformed,false);
  assert.doesNotMatch(p.stdout,/imagine-crm|example.test|18341|private-compose/);
  const saved=await stat(out);
  assert.equal(saved.mode&0o777,0o600);
  assert.match(await readFile(out,'utf8'),/127\.0\.0\.1:18341:8080/);
  const again=spawn(cli,args);
  assert.equal(again.status,1);
  assert.equal(again.stdout,'');
 });
});
test('F149 denies unexpected deploy privilege in operator input',async()=>{
 await fixture(async a=>{
  await assert.rejects(render({
   privateInventory:{...inventory(),approveDeploy:true},
   migrationInput:a.plan,buildDirectory:a.build,nginxConfigPath:a.conf
  }),/SEO F147/);
 });
});
