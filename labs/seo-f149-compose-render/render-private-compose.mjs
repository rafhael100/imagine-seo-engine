/**
 * SEO F149 — offline, fail-closed Docker Compose renderer for one
 * private staging Nginx. No Docker CLI, network, file mutation or deployment.
 *
 * Validates F147 operator inventory, F128 real HTML build and F145 exact
 * Nginx configuration before rendering any Compose source.
 */
import {lstat,open,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,isAbsolute,resolve} from 'node:path';
import {reviewIsolatedSeoStagingInventory} from
  '../../src/staging-compose-isolation-review.mjs';
import {renderIsolatedNginxStagingConfig} from
  '../seo-f145-nginx-render/render-staging-config.mjs';

const IMAGE='nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b';
const MAX_CONFIG=256*1024;
function exact(v,fields){
  if(!v||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const own=Reflect.ownKeys(v);
  return own.length===fields.length&&own.every(k=>{
    const d=Object.getOwnPropertyDescriptor(v,k);
    return typeof k==='string'&&fields.includes(k)&&
      d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function unsafe(){throw Error('SEO F149: unsafe or unapproved private staging input');}
async function canonicalPath(path,kind){
  if(typeof path!=='string'||path.length<2||path.length>2048||
     !isAbsolute(path)||/[\u0000-\u001f\u007f]/.test(path))unsafe();
  const resolved=resolve(path);
  if(resolved!==path||(await realpath(path))!==resolved)unsafe();
  const st=await lstat(resolved);
  if(st.isSymbolicLink()||!(kind==='dir'?st.isDirectory():st.isFile()))
    unsafe();
  if(kind==='file'){
    if(st.size<64||st.size>MAX_CONFIG||
       (process.platform!=='win32'&&
        ((st.mode&0o022)!==0||
         (typeof process.getuid==='function'&&st.uid!==process.getuid()))))
      unsafe();
    const folder=dirname(resolved);
    const owner=await lstat(folder);
    if(!owner.isDirectory()||owner.isSymbolicLink()||
       (await realpath(folder))!==folder||
       (process.platform!=='win32'&&
        ((owner.mode&0o077)!==0||
         (typeof process.getuid==='function'&&owner.uid!==process.getuid()))))
      unsafe();
  }
  return resolved;
}
async function readExactNginxConfig(path){
  const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
    const s=await fd.stat();
    if(!s.isFile()||s.size<64||s.size>MAX_CONFIG)unsafe();
    const data=await fd.readFile();
    if(data.length!==s.size||data.length>MAX_CONFIG)unsafe();
    return new TextDecoder('utf-8',{fatal:true}).decode(data);
  }finally{await fd.close();}
}
export async function renderPrivateStagingCompose(input){
  if(!exact(input,['privateInventory','migrationInput',
      'buildDirectory','nginxConfigPath']))unsafe();
  const baseline=reviewIsolatedSeoStagingInventory(input.privateInventory);
  if(baseline.reviewStatus!=='human_host_inventory_review_required')
    throw Error('SEO F149: host inventory has unresolved isolation conflict');
  const build=await canonicalPath(input.buildDirectory,'dir');
  const conf=await canonicalPath(input.nginxConfigPath,'file');
  const rendered=await renderIsolatedNginxStagingConfig({
    migrationInput:input.migrationInput,buildDirectory:build
  });
  const realConf=await readExactNginxConfig(conf);
  if(realConf!==rendered.privateConfig)
    throw Error('SEO F149: Nginx config not identical to vetted F145 output');

  const q=input.privateInventory.requested;
  const compose=[
    '# SEO F149 — PRIVATE STAGING ONLY. NO production deploy.',
    'name: '+JSON.stringify(q.composeProject),
    'services:',
    '  nginx:',
    '    image: '+IMAGE,
    '    user: "101:101"',
    '    read_only: true',
    '    cap_drop: ["ALL"]',
    '    security_opt: ["no-new-privileges:true"]',
    '    mem_limit: '+JSON.stringify(q.memoryLimitMiB+'m'),
    '    cpus: '+JSON.stringify(String(q.cpuLimit)),
    '    pids_limit: 64',
    '    restart: "no"',
    '    ports: ['+JSON.stringify('127.0.0.1:'+q.loopbackPort+':8080')+']',
    '    tmpfs:',
    '      - "/tmp:rw,nosuid,nodev,uid=101,gid=101,mode=1777,size=16m"',
    '    volumes:',
    '      - type: bind',
    '        source: '+JSON.stringify(build),
    '        target: /usr/share/nginx/html',
    '        read_only: true',
    '      - type: bind',
    '        source: '+JSON.stringify(conf),
    '        target: /etc/nginx/nginx.conf',
    '        read_only: true',
    '    networks: ["seo_f149_staging"]',
    '    healthcheck:',
    '      test: ["CMD","wget","-q","-O","/dev/null","http://127.0.0.1:8080/"]',
    '      interval: 3s',
    '      timeout: 3s',
    '      retries: 20',
    'networks:',
    '  seo_f149_staging:',
    '    name: '+JSON.stringify(q.networkName),
    '    driver: bridge',
    ''
  ].join('\n');
  return {
    privateCompose:compose,
    review:{
      contractVersion:'seo-f149-private-staging-compose-render-v1',
      reviewStatus:'human_compose_safety_review_required',
      imagePinnedByDigest:true,
      localConfigMatchesAuditedBuild:true,
      localHostInventoryClaimAcceptedForReview:true,
      singleLoopbackPublishedPort:true,
      noPersistentDockerVolumes:true,
      readOnlyStaticAndConfigMounts:true,
      namespacesSeparatedInOperatorInventory:true,
      operatorHostSnapshotAuthenticated:false,
      portReserved:false,
      imageCveReviewCompleted:false,
      publicTlsIdentityVerified:false,
      dockerCommandsPerformed:false,
      serviceStarted:false,
      vpsChangesApplied:false,
      deploymentAuthorized:false,
      releaseStatus:'HOLD_DOCKER_NETWORK_FIREWALL_BACKUP_AND_HUMAN_APPROVAL'
    }
  };
}
