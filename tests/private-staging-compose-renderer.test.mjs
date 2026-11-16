import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,stat,symlink,rm,chmod,mkdir,access} from 'node:fs/promises';
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
  assert.match(result.privateCompose,/internal: true/);
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

test('F194 rejects world-readable topology inventory or migration manifest',async()=>{
 await fixture(async a=>{
  const out=join(a.dir,'must-not-write-compose.yml');
  const args=['--inventory',a.inventoryPath,'--manifest',a.planPath,
   '--build',a.build,'--nginx-conf',a.conf,'--out',out];
  await chmod(a.inventoryPath,0o644);
  const one=spawn(cli,args);
  assert.equal(one.status,1);
  assert.equal(one.stdout,'');
  await assert.rejects(access(out));
  await chmod(a.inventoryPath,0o600);
  await chmod(a.planPath,0o644);
  const two=spawn(cli,args);
  assert.equal(two.status,1);
  assert.equal(two.stdout,'');
  await assert.rejects(access(out));
 });
});
test('F194 denies Compose generation in public or symlinked host directories',async()=>{
 await fixture(async a=>{
  const args=['--inventory',a.inventoryPath,'--manifest',a.planPath,
   '--build',a.build,'--nginx-conf',a.conf,
   '--out',join(a.dir,'must-not-write-compose.yml')];
  await chmod(a.dir,0o755);
  const result=spawn(cli,args);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  await assert.rejects(access(args.at(-1)));
  await chmod(a.dir,0o700);
  const link=join(a.dir,'alias');
  await symlink(a.dir,link);
  args[args.length-1]=join(link,'must-not-write.yml');
  const symlinked=spawn(cli,args);
  assert.equal(symlinked.status,1);
  await assert.rejects(access(join(a.dir,'must-not-write.yml')));
 });
});
test('F194 refuses Compose output in any Git checkout, including foreign private worktree',async()=>{
 await fixture(async a=>{
  const work=join(a.dir,'not-a-permitted-git-project');
  await mkdir(join(work,'.git'),{recursive:true,mode:0o700});
  const target=join(work,'private-compose.yml');
  const args=['--inventory',a.inventoryPath,'--manifest',a.planPath,
   '--build',a.build,'--nginx-conf',a.conf,'--out',target];
  const result=spawn(cli,args);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  await assert.rejects(access(target));
 });
});
test('F194 library refuses publicly traversable parent of a private 0644 Nginx file',async()=>{
 await fixture(async a=>{
  const folder=join(a.dir,'public-nginx');
  await mkdir(folder,{mode:0o755});
  const conf=join(folder,'publicly-reachable-private.conf');
  await writeFile(conf,await readFile(a.conf),{mode:0o644});
  await assert.rejects(render({
    privateInventory:inventory(),migrationInput:a.plan,
    buildDirectory:a.build,nginxConfigPath:conf
  }),/SEO F149/);
 });
});
