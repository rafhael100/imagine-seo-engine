#!/usr/bin/env node
/**
 * SEO F198: COMPLEMENTARY no-published-port internal Docker lab.
 * Docker internal bridge intentionally prevents host-loopback published
 * ingress; F150/F197 keep their separate unchanged HTTP HEAD/GET proofs.
 * This mode verifies F348 real bytes via docker exec *inside* the container.
 */
import {mkdtemp,writeFile,readFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {createServer} from 'node:net';
import {execFileSync} from 'node:child_process';
import {renderIsolatedNginxStagingConfig} from
 '../seo-f145-nginx-render/render-staging-config.mjs';
import {renderPrivateStagingCompose} from
 '../seo-f149-compose-render/render-private-compose.mjs';
import {reviewRunningStagingContainer} from
 '../seo-f151-docker-runtime/audit-running-container.mjs';
import {reviewInternalStagingDockerNetwork} from
 '../../src/private-bridge-network-review.mjs';

let diagnosticPhase='preflight';
const F348='5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444';
const DOMAIN='imaginecomunicacao.com.br';
const ORIGIN='https://'+DOMAIN+'/';
const IMAGE='nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b';
const exec=(bin,args,options={})=>execFileSync(bin,args,{
 timeout:120000,stdio:'ignore',...options
});
async function port(){
 const server=createServer();
 await new Promise((ok,fail)=>{
  server.once('error',fail);
  server.listen(0,'127.0.0.1',ok);
 });
 const n=server.address().port;
 await new Promise(ok=>server.close(ok));
 if(!Number.isSafeInteger(n)||n<1024||n>65535)throw Error('F198: bounded port required');
 return n;
}
const plan=()=>({
 sourceType:'operator_supplied_legacy_urls_unverified',
 siteDomain:DOMAIN,canonicalOrigin:ORIGIN,
 legacyUrls:['http://www.'+DOMAIN+'/'],
 targetRoutes:['/','/en/','/es/'],
 candidates:[{fromUrl:'http://www.'+DOMAIN+'/',toPath:'/',status:301}]
});
function snapshot(loopbackPort){
 const suffix=(process.env.GITHUB_RUN_ID??'ci').replace(/[^a-z0-9]/gi,'').slice(-10);
 const name='seo-f197-internal-'+suffix;
 return {
  sourceType:'operator_supplied_docker_host_inventory_unverified',
  requested:{
   composeProject:name,
   networkName:name+'-net',
   volumeName:name+'-unused',
   loopbackPort,memoryLimitMiB:512,cpuLimit:1
  },
  host:{availableMemoryMiB:16000,totalCpu:8,snapshotComplete:true},
  existing:{
   containerNames:['crm-untouched-synthetic'],
   networkNames:['crm-untouched-synthetic-network'],
   volumeNames:['crm-untouched-synthetic-volume'],
   listeningPorts:[18081],publishedPorts:[18081]
  }
 };
}
function noPortInternalVariant(source,portNumber){
 // Transform ONLY a schema-validated F149-generated candidate; never
 // accept or patch an operator-supplied Compose text or shell command.
 const portLine='    ports: ["127.0.0.1:'+portNumber+':8080"]';
 const driver='    driver: bridge';
 if(source.split(portLine).length!==2||source.split(driver).length!==2||
    source.includes('internal: true'))
  throw Error('F198: unexpected F149 Compose syntax');
 const result=source.replace(portLine,
  '    # F198: deliberately NO host-published ports')
  .replace(driver,driver+'\n    internal: true');
 if(result.includes('    ports:')||result.includes('127.0.0.1:')||
    result.split('internal: true').length!==2)
  throw Error('F198: internal no-port rendering failed');
 return result;
}
function dockerInspect(containerId){
 const raw=JSON.parse(execFileSync('docker',['inspect',containerId],{
  encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024,
  stdio:['ignore','pipe','ignore']
 }));
 if(!Array.isArray(raw)||raw.length!==1)
  throw Error('F198: real inspect required');
 return raw[0];
}
async function main(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||
    process.env.APP_ENV!=='testing'||
    process.env.SEO_F198_INTERNAL_LAB!=='YES_NO_PUBLISHED_PORTS'||
    process.argv.length!==3)
  throw Error('F198: no-published-ports lab opt-in required');
 diagnosticPhase='checkout';
 const root=resolve(process.argv[2]);
 const build=await realpath(root);
 if(build!==root||build!==resolve(dirname(build),'dist'))
  throw Error('F198: real immutable Astro build required');
 const head=execFileSync('git',['-C',dirname(build),'rev-parse','HEAD'],{
  encoding:'utf8',timeout:10000,maxBuffer:1024,
  stdio:['ignore','pipe','ignore']
 }).trim();
 if(head!==F348)throw Error('F198: wrong Comercial F348 checkout');
 diagnosticPhase='private-folder';
 const temp=await mkdtemp(join(tmpdir(),'seo-f198-noport-'));
 let yaml=null;
 try{
  diagnosticPhase='render-nginx';
  const migrationInput=plan();
  const rendered=await renderIsolatedNginxStagingConfig({
   migrationInput,buildDirectory:build
  });
  if(rendered.review.compiledTargetRoutes!==3||
     rendered.review.redirectsRendered!==1||
     rendered.review.productionReleaseAuthorized!==false)
   throw Error('F198: site route preflight refused');
  const conf=join(temp,'reviewed-nginx.conf');
  await writeFile(conf,rendered.privateConfig,{mode:0o644,flag:'wx'});
  const loopbackPort=await port();
  const inventory=snapshot(loopbackPort);
  diagnosticPhase='render-compose';
  const original=await renderPrivateStagingCompose({
   privateInventory:inventory,migrationInput,
   buildDirectory:build,nginxConfigPath:conf
  });
  if(original.review.deploymentAuthorized||
     !original.review.localConfigMatchesAuditedBuild)
   throw Error('F198: invalid staged source');
  diagnosticPhase='no-port-transform';
  const internal=noPortInternalVariant(original.privateCompose,loopbackPort);
  yaml=join(temp,'internal-only-compose.yml');
  await writeFile(yaml,internal,{mode:0o600,flag:'wx'});
  diagnosticPhase='docker-config';
  exec('docker',['compose','-f',yaml,'config','--quiet']);
  diagnosticPhase='docker-up';
  exec('docker',['compose','-f',yaml,'up','-d','--wait',
   '--pull','always','--no-build']);

  diagnosticPhase='inspect-runtime';
  const id=execFileSync('docker',['compose','-f',yaml,'ps','-q','nginx'],{
   encoding:'utf8',timeout:15000,maxBuffer:2048,
   stdio:['ignore','pipe','ignore']
  }).trim();
  if(!/^[a-f0-9]{64}$/.test(id))throw Error('F198: one real container required');
  const inspected=dockerInspect(id);
  if(Object.keys(inspected.HostConfig?.PortBindings??{}).length!==0)
   throw Error('F198: no host published port allowed');
  const net=JSON.parse(execFileSync('docker',['network','inspect',
   inventory.requested.networkName],{
   encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  if(!Array.isArray(net)||net.length!==1)
   throw Error('F198: real daemon network inspect absent');
  const network=reviewInternalStagingDockerNetwork({
   inspect:net[0],expectedNetworkName:inventory.requested.networkName,
   containerId:id
  });
  if(!network.dockerInternalNetworkFlagObserved||
     !network.exactExpectedSingleContainerObserved||
     network.deploymentAuthorized)
   throw Error('F198: network is not internal-only');

  // F151 remains authoritative for the PUBLISHED-PORT staging variant.
  // Here the ONLY expected F151 warning is "no published host port".
  // Every OTHER runtime safety control must still pass unchanged.
  const runtime=reviewRunningStagingContainer({
   inspect:inspected,expected:{
    image:IMAGE,networkName:inventory.requested.networkName,
    buildPath:build,configPath:conf,loopbackPort,
    memoryLimitMiB:512,cpuLimit:1
   }
  });
  if(runtime.blockedComponents.length!==1||
     runtime.blockedComponents[0]!=='public_or_wrong_host_port_binding'||
     !runtime.summary.runtimeHealthy||
     !runtime.summary.expectedReadOnlyMountsObserved||
     !runtime.summary.readOnlyRootObserved||
     !runtime.summary.requestedResourcesEnforced||
     !runtime.summary.singleProjectNetworkObserved)
   throw Error('F198: runtime has security drift beyond intentionally absent port');

  // Inside-container GET requires NO network publishing or host access.
  // Nginx intentionally accepts plain loopback Host when proto is absent.
  diagnosticPhase='internal-http';
  for(const [route,file] of [
   ['/','index.html'],['/en/','en/index.html'],['/es/','es/index.html']
  ]){
   const local=await readFile(join(build,file));
   if(local.length<200||local.length>2*1024*1024)
    throw Error('F198: bounded local HTML required');
   const served=execFileSync('docker',[
    'exec',id,'wget','-qO-','http://127.0.0.1:8080'+route
   ],{
    encoding:'buffer',timeout:15000,maxBuffer:2*1024*1024,
    stdio:['ignore','pipe','ignore']
   });
   if(!served.equals(local))
    throw Error('F198: internal Docker HTML differs from real F348 build');
  }
  process.stdout.write(JSON.stringify({
   contractVersion:'seo-f198-real-f348-docker-internal-no-published-port-v1',
   pinnedComercialF348HeadVerified:true,
   actualInternalDockerBridgeVerified:true,
   publishedHostPorts:0,
   internalNetworkParticipants:1,
   realF348LocalHtmlGetByteIdentical:3,
   actualDockerNginxRunningAndHealthy:true,
   actualHostLoopbackHttpTestPerformed:false,
   activeOutboundPacketTestPerformed:false,
   googleOrCustomerDataUsed:false,
   productionOriginAuthenticated:false,
   publicReleaseAuthorized:false,
   productionDeploymentAuthorized:false,
   releaseStatus:'HOLD_NONPUBLIC_INTERNAL_LAB_TLS_VPS_AND_HUMAN_REVIEW'
  })+'\n');
 }finally{
  if(yaml!==null){
   try{exec('docker',['compose','-f',yaml,'down',
    '--volumes','--remove-orphans']);}
   catch{/* dispose ephemeral runner, never claim remote cleanup */}
  }
  await rm(temp,{recursive:true,force:true});
 }
}
main().catch(()=>{
 process.stderr.write('SEO F198: internal no-port Docker lab failed safely at '+diagnosticPhase+'\n');
 process.exitCode=1;
});
