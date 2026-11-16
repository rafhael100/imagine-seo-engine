import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm,chmod,mkdir,access,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cli=fileURLToPath(new URL(
  '../scripts/review-staging-docker-inventory-offline.mjs',import.meta.url));
function sample(){
  return {
    sourceType:'operator_supplied_docker_host_inventory_unverified',
    requested:{
      composeProject:'seo-private-staging',networkName:'seo-private-network',
      volumeName:'seo-private-volume',loopbackPort:18313,
      memoryLimitMiB:512,cpuLimit:1
    },
    host:{availableMemoryMiB:13000,totalCpu:8,snapshotComplete:true},
    existing:{
      containerNames:['crm-secret-web'],
      networkNames:['crm-secret-network'],volumeNames:['crm-secret-data'],
      listeningPorts:[18081,18082],publishedPorts:[18081]
    }
  };
}
const run=path=>spawnSync(process.execPath,[cli,path],{
  encoding:'utf8',timeout:12000,maxBuffer:1024*1024
});
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),'seo-f147-'));
 try{
  const path=join(dir,'docker-inventory-private.json');
  await writeFile(path,JSON.stringify(sample()),{mode:0o600});
  await fn({path,dir});
 }finally{await rm(dir,{force:true,recursive:true});}
}
test('F147 CLI sanitizes real-style snapshot and requests review only',async()=>{
 await fixture(async({path})=>{
  const p=run(path);
  assert.equal(p.status,0,p.stderr);
  assert.equal(p.stderr,'');
  const out=JSON.parse(p.stdout);
  assert.equal(out.reviewStatus,'human_host_inventory_review_required');
  assert.equal(out.vpsChangesApplied,false);
  assert.equal(out.actualPortReserved,false);
  assert.doesNotMatch(p.stdout,/crm-secret|18313|18081|private\.json/);
 });
});
test('F147 CLI exits 2 on a port collision with CRM services',async()=>{
 await fixture(async({path})=>{
  const data=sample();data.requested.loopbackPort=18081;
  await writeFile(path,JSON.stringify(data));
  const p=run(path);
  assert.equal(p.status,2,p.stderr);
  assert.equal(JSON.parse(p.stdout).reviewStatus,'blocked');
  assert.equal(p.stderr,'');
 });
});
test('F147 CLI refuses symlinked or malformed inventory without printing data',async()=>{
 await fixture(async({path,dir})=>{
  const alias=join(dir,'alias.json');
  await symlink(path,alias);
  const a=run(alias);
  assert.equal(a.status,1);
  assert.equal(a.stdout,'');
  assert.equal(a.stderr,'SEO F147: invalid or unsafe private Docker inventory\n');
  await writeFile(path,'{"secret":"PRIVATE');
  const b=run(path);
  assert.equal(b.status,1);
  assert.equal(b.stdout,'');
  assert.equal(b.stderr,'SEO F147: invalid or unsafe private Docker inventory\n');
 });
});

test('F196 accepts operator-only 0700 directory and 0600 Docker topology file',async()=>{
 await fixture(async({path,dir})=>{
  assert.equal((await stat(dir)).mode&0o777,0o700);
  assert.equal((await stat(path)).mode&0o777,0o600);
  const result=run(path);
  assert.equal(result.status,0);
  assert.equal(JSON.parse(result.stdout).vpsChangesApplied,false);
 });
});
test('F196 refuses 0644 inventory and 0755 input parent with zero topology disclosure',async()=>{
 await fixture(async({path,dir})=>{
  await chmod(path,0o644);
  const exposedFile=run(path);
  assert.equal(exposedFile.status,1);
  assert.equal(exposedFile.stdout,'');
  assert.doesNotMatch(exposedFile.stderr,/crm-secret|18313|private\.json/);
  await chmod(path,0o600);
  await chmod(dir,0o755);
  const exposedParent=run(path);
  assert.equal(exposedParent.status,1);
  assert.equal(exposedParent.stdout,'');
  await chmod(dir,0o700);
 });
});
test('F196 rejects private Docker inventory inside another Git checkout/worktree',async()=>{
 await fixture(async({path,dir})=>{
  const git=join(dir,'foreign-git');
  const privateDir=join(git,'operator');
  await mkdir(join(git,'.git'),{recursive:true,mode:0o700});
  await mkdir(privateDir,{mode:0o700});
  const nested=join(privateDir,'docker-topology.json');
  const {readFile}=await import('node:fs/promises');
  await writeFile(nested,await readFile(path),{mode:0o600});
  const result=run(nested);
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.doesNotMatch(result.stderr,/crm-secret|foreign-git/);
 });
});
test('F196 refuses symbolic private directory aliases even for 0600 source files',async()=>{
 await fixture(async({path,dir})=>{
  const alias=join(dir,'symlink-parent');
  await symlink(dir,alias);
  const result=run(join(alias,'docker-inventory-private.json'));
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
 });
});
