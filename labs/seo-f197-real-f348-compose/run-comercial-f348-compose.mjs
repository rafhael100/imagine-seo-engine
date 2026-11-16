#!/usr/bin/env node
/**
 * SEO F197 — CI-ONLY real Comercial F348 Astro -> F145 Nginx ->
 * F149 restricted Docker Compose -> F151 actual inspect -> F143
 * actual HTTP HEAD and byte-identical HTML GET for PT/EN/ES.
 *
 * Google PAGE observations and old URLs below are synthetics. NO production,
 * actual GSC OAuth, VPS, public TLS, deployment or customer data.
 */
import {mkdtemp,writeFile,readFile,rm,realpath,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
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
import {runServedHtmlAttestedStagingQa} from
 '../seo-f143-full-served-gate/run-served-html-staging-gate.mjs';

const F348='5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444';
const DOMAIN='imaginecomunicacao.com.br';
const ORIGIN='https://'+DOMAIN+'/';
const NGINX='nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b';
const command=(binary,args,options={})=>execFileSync(binary,args,{
  timeout:120000,stdio:'ignore',...options
});
function migration(){
 const source='operator_supplied_legacy_urls_unverified';
 return {
  sourceType:source,
  siteDomain:DOMAIN,canonicalOrigin:ORIGIN,
  legacyUrls:[
   'http://www.'+DOMAIN+'/',
   'https://www.'+DOMAIN+'/en/'
  ],
  targetRoutes:['/','/en/','/es/'],
  candidates:[
   {fromUrl:'http://www.'+DOMAIN+'/',toPath:'/',status:301},
   {fromUrl:'https://www.'+DOMAIN+'/en/',toPath:'/en/',status:301}
  ]
 };
}
function gsc(){
 const row=(url,clicks,impressions)=>({
  keys:[url],clicks,impressions,
  ctr:impressions?clicks/impressions:0,position:12.5
 });
 return {
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:'+DOMAIN,canonicalOrigin:ORIGIN,
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],
  rows:[
   row('http://www.'+DOMAIN+'/',3,134),
   row('https://www.'+DOMAIN+'/en/',1,22),
   row(ORIGIN,0,9),row(ORIGIN+'en/',0,3),
   row(ORIGIN+'es/',0,5)
  ],
  hasMore:false
 };
}
async function randomLoopbackPort(){
 const server=createServer();
 await new Promise((done,fail)=>{
  server.once('error',fail);
  server.listen(0,'127.0.0.1',done);
 });
 const port=server.address().port;
 await new Promise(done=>server.close(done));
 if(!Number.isSafeInteger(port)||port<1024||port>65535)
  throw Error('F197: unavailable isolated loopback port');
 return port;
}
function inventory(port){
 const suffix=(process.env.GITHUB_RUN_ID??'ci')
  .replace(/[^0-9a-z]/gi,'').slice(-10);
 const project='seo-f197-'+suffix;
 return {
  sourceType:'operator_supplied_docker_host_inventory_unverified',
  requested:{
   composeProject:project,networkName:project+'-net',
   volumeName:project+'-unused',loopbackPort:port,
   memoryLimitMiB:512,cpuLimit:1
  },
  host:{availableMemoryMiB:16000,totalCpu:8,snapshotComplete:true},
  existing:{
   containerNames:['crm-synthetic-unmodified'],
   networkNames:['crm-synthetic-unmodified-net'],
   volumeNames:['crm-synthetic-unused-volume'],
   listeningPorts:[18081],publishedPorts:[18081]
  }
 };
}
function actualDockerInspect(yaml){
 const id=execFileSync('docker',['compose','-f',yaml,'ps','-q','nginx'],{
  encoding:'utf8',timeout:15000,maxBuffer:2048,
  stdio:['ignore','pipe','ignore']
 }).trim();
 if(!/^[a-f0-9]{12,64}$/.test(id))
  throw Error('F197: missing unique disposable Nginx container');
 const response=execFileSync('docker',['inspect',id],{
  encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024,
  stdio:['ignore','pipe','ignore']
 });
 const data=JSON.parse(response);
 if(!Array.isArray(data)||data.length!==1)
  throw Error('F197: unexpected real Docker response');
 return {inspect:data[0],containerId:id};
}
async function main(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||
    process.env.APP_ENV!=='testing'||
    process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
    process.env.SEO_F197_REAL_COMERCIAL_LAB!=='YES_SYNTHETIC_GSC_ONLY'||
    process.argv.length!==3)
  throw Error('F197: explicit CI-only Docker lab required');
 const original=resolve(process.argv[2]);
 const built=await realpath(process.argv[2]);
 const st=await stat(built);
 if(built!==original||!st.isDirectory()||
    built!==resolve(dirname(built),'dist'))
  throw Error('F197: canonical compiled Astro directory required');
 const checkout=dirname(built);
 const head=execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{
  encoding:'utf8',timeout:10000,maxBuffer:1024,
  stdio:['ignore','pipe','ignore']
 }).trim();
 if(head!==F348)throw Error('F197: required immutable Comercial F348 checkout absent');
 const temp=await mkdtemp(join(tmpdir(),'seo-f197-f348-docker-'));
 let yaml=null;
 try{
  const plan=migration();
  const rendered=await renderIsolatedNginxStagingConfig({
   migrationInput:plan,buildDirectory:built
  });
  if(rendered.review.redirectsRendered!==2||
     rendered.review.compiledTargetRoutes!==3||
     rendered.review.productionReleaseAuthorized!==false)
   throw Error('F197: real compiled F348 must have three reviewed target routes');
  const conf=join(temp,'nginx-f197-private.conf');
  await writeFile(conf,rendered.privateConfig,{mode:0o644,flag:'wx'});
  const port=await randomLoopbackPort();
  const host=inventory(port);
  const composed=await renderPrivateStagingCompose({
   privateInventory:host,migrationInput:plan,
   buildDirectory:built,nginxConfigPath:conf
  });
  if(composed.review.deploymentAuthorized||
     composed.review.publicTlsIdentityVerified||
     composed.review.localConfigMatchesAuditedBuild!==true)
   throw Error('F197: unauthorized Compose authority');
  yaml=join(temp,'private-compose-f197.yml');
  await writeFile(yaml,composed.privateCompose,{mode:0o600,flag:'wx'});
  command('docker',['compose','-f',yaml,'config','--quiet']);
  command('docker',['compose','-f',yaml,'up','-d','--wait',
   '--pull','always','--no-build']);

  // Actual Docker daemon state, not a JSON assertion supplied by a caller.
  const realDocker=actualDockerInspect(yaml);
  const checked=reviewRunningStagingContainer({
   inspect:realDocker.inspect,
   expected:{
    image:NGINX,networkName:host.requested.networkName,
    buildPath:built,configPath:conf,loopbackPort:port,
    memoryLimitMiB:512,cpuLimit:1
   }
  });
  if(checked.reviewStatus!=='human_real_docker_runtime_review_required'||
     checked.blockedComponents.length!==0||
     !checked.summary.runtimeHealthy||
     !checked.summary.loopbackOnlyPortObserved||
     checked.productionDeploymentAuthorized)
   throw Error('F197: real Nginx Docker runtime not isolated');

  // F198: verify the daemon-created bridge is INTERNAL and has precisely
  // our container. We never serialize raw Docker network settings or IDs.
  const rawNetworks=JSON.parse(execFileSync('docker',[
   'network','inspect',host.requested.networkName
  ],{
   encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  if(!Array.isArray(rawNetworks)||rawNetworks.length!==1)
   throw Error('SEO F198: real bridge inspect missing');
  const isolation=reviewInternalStagingDockerNetwork({
   inspect:rawNetworks[0],
   expectedNetworkName:host.requested.networkName,
   containerId:realDocker.containerId
  });
  if(!isolation.dockerInternalNetworkFlagObserved||
     !isolation.exactExpectedSingleContainerObserved||
     isolation.deploymentAuthorized)
   throw Error('SEO F198: F348 Compose Docker network not internal');

  // Actual HEAD + GET response parity with the three F348 HTML files.
  // The GSC PAGE rows are FIXED synthetic data, not a Search Console export.
  const audit=await runServedHtmlAttestedStagingQa({
   gscPageInput:gsc(),migrationInput:plan,buildDirectory:built,
   stagingPort:port,timeoutMs:3000
  });
  const report=audit.report;
  if(report.reviewStatus!==
       'human_independent_served_html_staging_review_required'||
     report.summary.validHttp301Receipts!==2||
     report.summary.identicalServedHtmlRoutes!==3||
     report.summary.servedGetRoutesChecked!==3||
     report.buildDigestMatchedInLocalProxy!==true||
     report.buildStableDuringGetAudit!==true||
     report.realLoopbackGetPerformed!==true||
     report.productionReleaseAuthorized!==false||
     report.publicTlsIdentityVerified!==false)
   throw Error('F197: Nginx real HEAD/GET failed compiled F348 parity');

  // Do not print Docker data, private configuration, headers, paths, URLs
  // or source GSC rows. This stdout contains fixed flags and counts only.
  process.stdout.write(JSON.stringify({
   contractVersion:'seo-f197-real-f348-isolated-nginx-compose-e2e-v1',
   immutableComercialHeadChecked:true,
   actualCompiledAstroLocales:3,
   realDockerNginxStarted:true,
   actualDockerInspectReviewed:true,
   actualLocalHttpHeadRedirectReceipts:2,
   actualLocalHttpGetBodiesCompared:3,
   byteIdenticalRealF348Html:3,
   localBuildDigestMatched:true,
   privateNginxConfigMountedReadonly:true,
   realDockerInternalBridgeVerified:true,
   exactlyOneNetworkContainerVerified:true,
   packetEgressActivelyTested:false,
   gscPageSourceAuthenticated:false,
   oauthTenantVerified:false,
   customerDataUsed:false,
   tlsOrLeasewebVerified:false,
   productionRedirectsApplied:false,
   publicReleaseAuthorized:false,
   mergeAuthorized:false,
   deploymentAuthorized:false,
   releaseStatus:'HOLD_REAL_GSC_TLS_VPS_BACKUP_AND_HUMAN_REVIEW'
  })+'\n');
 }finally{
  if(yaml!==null){
   try{command('docker',['compose','-f',yaml,'down',
    '--volumes','--remove-orphans']);}
   catch{/* Runner is disposable; failure to clean does not authorize use. */}
  }
  await rm(temp,{recursive:true,force:true});
 }
}
main().catch(()=>{
 process.stderr.write('SEO F197: isolated F348 Docker/Nginx proof failed safely\n');
 process.exitCode=1;
});
