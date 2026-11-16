import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewRunningStagingContainer as review} from
  '../labs/seo-f151-docker-runtime/audit-running-container.mjs';

const IMAGE='nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b';
function expected(){
 return {
  image:IMAGE,networkName:'seo-f151-ci-net',
  buildPath:'/tmp/seo-f151-static',
  configPath:'/tmp/seo-f151-nginx.conf',
  loopbackPort:18297,memoryLimitMiB:512,cpuLimit:1
 };
}
function container(){
 const e=expected();
 return {
  Config:{Image:e.image,User:'101:101',Env:['PRIVATE_PASSWORD=never-log']},
  State:{Running:true,Health:{Status:'healthy'}},
  HostConfig:{
   ReadonlyRootfs:true,Privileged:false,CapDrop:['ALL'],CapAdd:[],
   SecurityOpt:['no-new-privileges:true'],Memory:536870912,
   NanoCpus:1000000000,PidsLimit:64,
   PortBindings:{'8080/tcp':[{
     HostIp:'127.0.0.1',HostPort:String(e.loopbackPort)
   }]},
   NetworkMode:e.networkName,PidMode:'',IpcMode:'private',
   Binds:null,Tmpfs:{'/tmp':'rw,nosuid,nodev,uid=101,gid=101,mode=1777,size=16m'},
   RestartPolicy:{Name:'no'}
  },
  NetworkSettings:{
   Networks:{[e.networkName]:{IPAddress:'172.22.0.8'}},
   Ports:{'80/tcp':null,'8080/tcp':[{
     HostIp:'127.0.0.1',HostPort:String(e.loopbackPort)
   }]}
  },
  Mounts:[
   {Type:'bind',Source:e.buildPath,Destination:'/usr/share/nginx/html',RW:false},
   {Type:'bind',Source:e.configPath,Destination:'/etc/nginx/nginx.conf',RW:false}
  ],
  Id:'some-private-container-identity',
  Name:'some-private-network-container'
 };
}
const run=(inspect=container(),e=expected())=>review({
 inspect,expected:e
});
test('F151 validates Docker observed read-only, no root and port rather than Compose assertions',()=>{
 const out=run();
 assert.equal(out.reviewStatus,'human_real_docker_runtime_review_required');
 assert.deepEqual(out.blockedComponents,[]);
 assert.equal(out.summary.expectedImageDigestMatched,true);
 assert.equal(out.summary.readOnlyRootObserved,true);
 assert.equal(out.summary.requestedResourcesEnforced,true);
 assert.equal(out.summary.expectedReadOnlyMountsObserved,true);
 assert.equal(out.summary.loopbackOnlyPortObserved,true);
 assert.equal(out.productionDeploymentAuthorized,false);
 assert.equal(out.networkEgressIsolationProved,false);
 for(const secret of ['PRIVATE_PASSWORD','some-private',
    '/tmp/seo-f151','172.22.0.8','18297'])
   assert.ok(!JSON.stringify(out).includes(secret),secret);
});
test('F151 catches privilege escalation, root and mutable images',()=>{
 const r=container();
 r.Config.Image='nginx:latest';
 r.Config.User='root';
 r.HostConfig.ReadonlyRootfs=false;
 r.HostConfig.Privileged=true;
 r.HostConfig.CapDrop=[];
 r.HostConfig.SecurityOpt=[];
 const out=run(r);
 assert.equal(out.reviewStatus,'blocked');
 assert.ok(out.blockedComponents.includes('unexpected_image_or_mutable_tag'));
 assert.ok(out.blockedComponents.includes('privileged_rootfs_or_user'));
 assert.ok(out.blockedComponents.includes('capabilities_or_privileges_not_restricted'));
});
test('F151 detects port exposed publicly or additional network',()=>{
 const r=container();
 r.HostConfig.PortBindings['8080/tcp'][0].HostIp='0.0.0.0';
 r.NetworkSettings.Ports['8080/tcp'][0].HostIp='0.0.0.0';
 r.NetworkSettings.Networks.public={};
 const out=run(r);
 assert.ok(out.blockedComponents.includes('public_or_wrong_host_port_binding'));
 assert.ok(out.blockedComponents.includes('unexpected_or_host_network'));
 assert.equal(out.summary.loopbackOnlyPortObserved,false);
});
test('F151 blocks writable extra host mount, CPU and memory mismatch',()=>{
 const r=container();
 r.HostConfig.Memory=0;
 r.HostConfig.NanoCpus=0;
 r.Mounts[0].RW=true;
 r.Mounts.push({Type:'bind',Source:'/var/run/docker.sock',
   Destination:'/var/run/docker.sock',RW:true});
 const out=run(r);
 assert.ok(out.blockedComponents.includes('cpu_memory_or_pid_limit_drift'));
 assert.ok(out.blockedComponents.includes('unexpected_or_writable_filesystem_mount'));
});
test('F151 blocks incorrect temp permissions, unhealthy container, automatic restart',()=>{
 const r=container();
 r.State.Health.Status='unhealthy';
 r.HostConfig.Tmpfs['/tmp']='rw,mode=1777,size=4g';
 r.HostConfig.RestartPolicy.Name='always';
 const out=run(r);
 assert.deepEqual(out.blockedComponents,[
  'container_not_running_and_healthy',
  'unsafe_temporary_filesystem',
  'unexpected_restart_policy'
 ]);
});
test('F151 refuses fabricated expected runtime properties and invalid source',()=>{
 const data=container();
 assert.throws(()=>review({
  inspect:data,expected:{...expected(),approveDeploy:true}
 }),/SEO F151/);
 assert.throws(()=>review({
  inspect:data,expected:{...expected(),loopbackPort:'18297'}
 }),/SEO F151/);
 assert.throws(()=>review({
  inspect:null,expected:expected()
 }),/SEO F151/);
 const accessor=expected();
 Object.defineProperty(accessor,'loopbackPort',{
  enumerable:true,get(){throw Error('secret getter')}
 });
 assert.throws(()=>review({inspect:data,expected:accessor}),/SEO F151/);
});

test('F151 refuses a second actually published container port, not internal EXPOSE',()=>{
 const r=container();
 assert.equal(run(r).reviewStatus,'human_real_docker_runtime_review_required');
 r.NetworkSettings.Ports['443/tcp']=[{
  HostIp:'0.0.0.0',HostPort:'12443'
 }];
 const out=run(r);
 assert.equal(out.reviewStatus,'blocked');
 assert.ok(out.blockedComponents.includes('public_or_wrong_host_port_binding'));
});
