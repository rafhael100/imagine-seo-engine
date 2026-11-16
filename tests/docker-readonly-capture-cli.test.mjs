import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,readFile,stat,rm,access,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cli=fileURLToPath(new URL(
 '../labs/seo-f148-docker-host/capture-readonly-host.mjs',import.meta.url
));
const docker=`#!/bin/sh
set -eu
if [ -n "$MOCK_DOCKER_COMMAND_MARKER" ]; then
 printf "called" > "$MOCK_DOCKER_COMMAND_MARKER"
fi
case "$1 $2" in
  "context inspect") printf 'unix:///var/run/docker.sock\\n' ;;
  "container ls") printf 'imagine-crm-private\\nimagine-sites-private\\n' ;;
  "network ls") printf 'bridge\\ncrm-private-net\\n' ;;
  "volume ls") printf 'crm-private-volume\\n' ;;
  "ps --all") printf '127.0.0.1:18081->8080/tcp\\n' ;;
  *) exit 23 ;;
esac
`;
const ss=`#!/bin/sh
set -eu
if [ "$1" = "-H" ] && [ "$2" = "-lnt" ]; then
 printf 'LISTEN 0 128 127.0.0.1:18081 0.0.0.0:*\\n'
else
 exit 24
fi
`;
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'seo-f148-capture-'));
 try{
  const bin=join(root,'bin');
  await mkdir(bin);
  await writeFile(join(bin,'docker'),docker,{mode:0o700});
  await writeFile(join(bin,'ss'),ss,{mode:0o700});
  await chmod(join(bin,'docker'),0o700);
  await chmod(join(bin,'ss'),0o700);
  const out=join(root,'private-host-inventory.json');
  const args=[
   '--project','seo-f148-project',
   '--network','seo-f148-network',
   '--volume','seo-f148-volume',
   '--port','18591',
   '--memory-mib','128',
   '--cpus','1',
   '--out',out,
   '--read-only-local-host'
  ];
  const env={...process.env,
   PATH:bin+':'+(process.env.PATH??'/usr/bin:/bin'),
   DOCKER_HOST:'unix:///var/run/docker.sock',
   SEO_F148_LOCAL_INVENTORY:'YES_READ_ONLY_DOCKER_HOST',
   MOCK_DOCKER_COMMAND_MARKER:''
  };
  await fn({root,bin,out,args,env});
 }finally{await rm(root,{recursive:true,force:true});}
}
const run=(args,env)=>spawnSync(process.execPath,[cli,...args],{
 encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024,env
});
test('F148 calls only fixed read-only Docker commands and saves a private snapshot',async()=>{
 await fixture(async({out,args,env})=>{
  const p=run(args,env);
  assert.ok([0,2].includes(p.status),p.stderr);
  assert.equal(p.stderr,'');
  const report=JSON.parse(p.stdout);
  assert.equal(report.sourceAuthenticated,false);
  assert.equal(report.dockerCommandsPerformed,true);
  assert.equal(report.dockerReadOnlyQueriesPerformed,true);
  assert.equal(report.localUnixDockerEndpointOnly,true);
  assert.equal(report.vpsChangesApplied,false);
  const data=JSON.parse(await readFile(out,'utf8'));
  assert.deepEqual(data.existing.containerNames,[
   'imagine-crm-private','imagine-sites-private'
  ]);
  assert.deepEqual(data.existing.listeningPorts,[18081]);
  assert.deepEqual(data.existing.publishedPorts,[18081]);
  const metadata=await stat(out);
  assert.equal(metadata.mode&0o777,0o600);
  for(const forbidden of ['imagine-crm-private','crm-private-volume',
   '18081','18591','private-host-inventory'])
   assert.ok(!(p.stdout+p.stderr).includes(forbidden),forbidden);
  const second=run(args,env);
  assert.equal(second.status,1);
  assert.equal(second.stdout,'');
 });
});
test('F148 denies remote Docker host env before snapshot output',async()=>{
 await fixture(async({out,args,env})=>{
  const p=run(args,{...env,DOCKER_HOST:'ssh://untrusted.example.test'});
  assert.equal(p.status,1);
  assert.equal(p.stdout,'');
  assert.equal(p.stderr,
   'SEO F148: failed to capture safe local Docker inventory\n');
  await assert.rejects(readFile(out,'utf8'));
 });
});
test('F148 requires explicit operator opt-in before any commands',async()=>{
 await fixture(async({out,args,env})=>{
  const unsafe={...env};
  delete unsafe.SEO_F148_LOCAL_INVENTORY;
  const p=run(args,unsafe);
  assert.equal(p.status,1);
  assert.equal(p.stdout,'');
  await assert.rejects(readFile(out,'utf8'));
 });
});

test('F148 refuses remote Docker context BEFORE listing any container',async()=>{
 await fixture(async({root,bin,out,args,env})=>{
  const marker=join(root,'UNSAFE_REMOTE_QUERY_WAS_SENT');
  const remoteDocker=`#!/bin/sh
set -eu
if [ "$1 $2" = "context inspect" ]; then
 printf 'ssh://remote.example.test\\n'
else
 printf 'unsafe' > "$MOCK_REMOTE_QUERY_MARKER"
fi
`;
  await writeFile(join(bin,'docker'),remoteDocker,{mode:0o700});
  await chmod(join(bin,'docker'),0o700);
  const result=run(args,{
   ...env,
   DOCKER_HOST:'ssh://remote.example.test',
   MOCK_REMOTE_QUERY_MARKER:marker
  });
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.equal(result.stderr,
    'SEO F148: failed to capture safe local Docker inventory'+String.fromCharCode(10));
  await assert.rejects(readFile(marker,'utf8'));
  await assert.rejects(readFile(out,'utf8'));
 });
});

test('F200 refuses public 0755 snapshot output parent before ANY Docker command',async()=>{
 await fixture(async({root,out,args,env})=>{
  const marker=join(root,'DENIED_DOCKER_QUERY');
  await chmod(root,0o755);
  const result=run(args,{...env,MOCK_DOCKER_COMMAND_MARKER:marker});
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  await assert.rejects(access(marker));
  await assert.rejects(access(out));
  await chmod(root,0o700);
 });
});
test('F200 refuses snapshot output inside another Git checkout before querying host',async()=>{
 await fixture(async({root,args,env})=>{
  const repo=join(root,'another-private-checkout');
  const operator=join(repo,'private');
  await mkdir(join(repo,'.git'),{recursive:true,mode:0o700});
  await mkdir(operator,{mode:0o700});
  const target=join(operator,'network.json');
  const altered=[...args];altered[13]=target;
  const marker=join(root,'DENIED_GIT_DOCKER_QUERY');
  const result=run(altered,{...env,MOCK_DOCKER_COMMAND_MARKER:marker});
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  await assert.rejects(access(marker));
  await assert.rejects(access(target));
 });
});
test('F200 refuses symbolic parent aliases and never contacts Docker',async()=>{
 await fixture(async({root,args,env})=>{
  const alias=join(root,'alias');
  await symlink(root,alias);
  const altered=[...args];altered[13]=join(alias,'network.json');
  const marker=join(root,'DENIED_ALIAS_DOCKER_QUERY');
  const result=run(altered,{...env,MOCK_DOCKER_COMMAND_MARKER:marker});
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  await assert.rejects(access(marker));
 });
});
