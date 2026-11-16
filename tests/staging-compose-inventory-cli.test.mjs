import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
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
