/**
 * SEO F151 — verify Docker's ACTUAL container state after the private
 * F149 Compose is started in a disposable CI runner. Pure offline audit.
 *
 * Never return container IDs, addresses, URLs, paths, mounts, env, secrets,
 * raw docker inspect, or network topology. Runtime compliance != VPN,
 * firewall/egress assurance, image CVE verification, or release approval.
 */
const IMAGE='nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b';
const MAX_MEMORY=4096*1024*1024;
const REASONS=Object.freeze({
 image:'unexpected_image_or_mutable_tag',
 state:'container_not_running_and_healthy',
 root:'privileged_rootfs_or_user',
 caps:'capabilities_or_privileges_not_restricted',
 compute:'cpu_memory_or_pid_limit_drift',
 port:'public_or_wrong_host_port_binding',
 mounts:'unexpected_or_writable_filesystem_mount',
 network:'unexpected_or_host_network',
 temp:'unsafe_temporary_filesystem',
 restart:'unexpected_restart_policy'
});
function object(v){return v!==null&&typeof v==='object'&&!Array.isArray(v);}
function sameKeys(obj,keys){
 if(!object(obj)||![Object.prototype,null].includes(Object.getPrototypeOf(obj))||
    Reflect.ownKeys(obj).length!==keys.length)return false;
 return keys.every(k=>{
   const desc=Object.getOwnPropertyDescriptor(obj,k);
   return desc?.enumerable===true&&Object.hasOwn(desc,'value');
 });
}
function fail(){throw Error('SEO F151: invalid bounded local Docker inspect contract');}
export function reviewRunningStagingContainer(input){
 if(!sameKeys(input,['inspect','expected'])||
    !sameKeys(input.expected,[
      'image','networkName','buildPath','configPath',
      'loopbackPort','memoryLimitMiB','cpuLimit'
    ]))fail();
 const e=input.expected;
 if(typeof e.image!=='string'||e.image!==IMAGE||
    typeof e.networkName!=='string'||!/^[a-z][a-z0-9_.-]{2,90}$/.test(e.networkName)||
    typeof e.buildPath!=='string'||typeof e.configPath!=='string'||
    !e.buildPath.startsWith('/')||!e.configPath.startsWith('/')||
    e.buildPath.length>2048||e.configPath.length>2048||
    !Number.isSafeInteger(e.loopbackPort)||e.loopbackPort<1024||
    e.loopbackPort>65535||
    !Number.isSafeInteger(e.memoryLimitMiB)||e.memoryLimitMiB<128||
    e.memoryLimitMiB>4096||
    !Number.isSafeInteger(e.cpuLimit)||e.cpuLimit<1||e.cpuLimit>4)
   fail();
 const inspect=input.inspect;
 if(!object(inspect)||!object(inspect.Config)||
    !object(inspect.HostConfig)||!object(inspect.State)||
    !object(inspect.NetworkSettings)||!Array.isArray(inspect.Mounts))
   fail();
 const conf=inspect.Config,host=inspect.HostConfig;
 const state=inspect.State,net=inspect.NetworkSettings;
 const reasons=[];
 function deny(condition,reason){if(condition)reasons.push(reason);}
 deny(conf.Image!==e.image,REASONS.image);
 deny(state.Running!==true||state.Health?.Status!=='healthy',
   REASONS.state);
 deny(conf.User!=='101:101'||host.ReadonlyRootfs!==true||
      host.Privileged!==false,REASONS.root);
 deny(!Array.isArray(host.CapDrop)||
      host.CapDrop.length!==1||
      String(host.CapDrop[0]).toUpperCase()!=='ALL'||
      !Array.isArray(host.SecurityOpt)||
      !host.SecurityOpt.includes('no-new-privileges:true')||
      host.SecurityOpt.some(x=>x!=='no-new-privileges:true')||
      host.CapAdd?.length>0,REASONS.caps);
 const expectedMemory=e.memoryLimitMiB*1024*1024;
 const cpu=host.NanoCpus===e.cpuLimit*1e9||
   (host.CpuPeriod>0&&host.CpuQuota>0&&
     host.CpuQuota/host.CpuPeriod===e.cpuLimit);
 deny(host.Memory!==expectedMemory||
      expectedMemory>MAX_MEMORY||
      !cpu||host.PidsLimit!==64,REASONS.compute);
 const published=host.PortBindings;
 const portRefs=object(published)?Object.keys(published):[];
 const single=published?.['8080/tcp'];
 const netPortRefs=object(net.Ports)?Object.keys(net.Ports):[];
 // Docker image EXPOSE can add internal-only (null) 80/tcp entries.
 // Count only ACTUALLY PUBLISHED ports; any second non-null binding blocks.
 const netPublishedRefs=netPortRefs.filter(key=>net.Ports[key]!==null);
 const netPort=net.Ports?.['8080/tcp'];
 deny(portRefs.length!==1||portRefs[0]!=='8080/tcp'||
      !Array.isArray(single)||single.length!==1||
      single[0]?.HostIp!=='127.0.0.1'||
      single[0]?.HostPort!==String(e.loopbackPort)||
      netPublishedRefs.length!==1||netPublishedRefs[0]!=='8080/tcp'||
      !Array.isArray(netPort)||netPort.length!==1||
      netPort[0]?.HostIp!=='127.0.0.1'||
      netPort[0]?.HostPort!==String(e.loopbackPort),
      REASONS.port);
 const networks=object(net.Networks)?Object.keys(net.Networks):[];
 deny(networks.length!==1||networks[0]!==e.networkName||
      host.NetworkMode!==e.networkName||
      host.PidMode==='host'||host.IpcMode==='host',
      REASONS.network);
 const expectedMounts=new Map([
   ['/usr/share/nginx/html',e.buildPath],
   ['/etc/nginx/nginx.conf',e.configPath]
 ]);
 const seen=new Set();
 let mountsSafe=inspect.Mounts.length===2;
 for(const m of inspect.Mounts){
   if(!object(m)||m.Type!=='bind'||m.RW!==false||
      m.Mode?.includes('z')||!expectedMounts.has(m.Destination)||
      expectedMounts.get(m.Destination)!==m.Source||
      seen.has(m.Destination)){mountsSafe=false;continue;}
   seen.add(m.Destination);
 }
 deny(!mountsSafe||seen.size!==2||
      Object.keys(host.Binds??{}).length>2,REASONS.mounts);
 const temp=host.Tmpfs;
 const setting=object(temp)?temp['/tmp']:null;
 deny(!object(temp)||Object.keys(temp).length!==1||
      typeof setting!=='string'||!setting.includes('nosuid')||
      !setting.includes('nodev')||!setting.includes('size=16m'),
      REASONS.temp);
 deny(host.RestartPolicy?.Name!=='no',REASONS.restart);
 return {
   contractVersion:'seo-f151-running-staging-container-attestation-v1',
   reviewStatus:reasons.length?'blocked':
     'human_real_docker_runtime_review_required',
   blockedComponents:[...new Set(reasons)],
   summary:{
     runtimeRunning:state.Running===true,
     runtimeHealthy:state.Health?.Status==='healthy',
     expectedImageDigestMatched:conf.Image===e.image,
     readOnlyRootObserved:host.ReadonlyRootfs===true,
     noPrivilegesObserved:host.Privileged===false,
     requestedResourcesEnforced:host.Memory===expectedMemory&&cpu&&
       host.PidsLimit===64,
     loopbackOnlyPortObserved:portRefs.length===1&&
       single?.[0]?.HostIp==='127.0.0.1',
     expectedReadOnlyMountsObserved:mountsSafe&&seen.size===2,
     singleProjectNetworkObserved:networks.length===1&&
       networks[0]===e.networkName,
     blockedRuleCount:new Set(reasons).size
   },
   inspectedDataContainsSecretsNotReturned:true,
   dockerInspectSourceAuthenticated:false,
   networkEgressIsolationProved:false,
   imageCveReviewCompleted:false,
   publicTlsVerified:false,
   productionDeploymentAuthorized:false,
   releaseStatus:'HOLD_ACTUAL_VPS_IDENTITY_REVIEW_FIREWALL_BACKUP_AND_HUMAN_APPROVAL'
 };
}
