#!/usr/bin/env node
/**
 * SEO F150 — run the actual F149-generated Compose in disposable CI only.
 * No credentials, no VPS, no customer data, no DNS, no production release.
 */
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderIsolatedNginxStagingConfig} from
  '../seo-f145-nginx-render/render-staging-config.mjs';
import {renderPrivateStagingCompose} from
  '../seo-f149-compose-render/render-private-compose.mjs';

const MAX_WAIT=120000;
const execute=(bin,args,options={})=>execFileSync(bin,args,{
  timeout:MAX_WAIT,stdio:'ignore',...options
});
async function candidatePort(){
 const server=createServer();
 await new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(0,'127.0.0.1',resolve);
 });
 const port=server.address().port;
 await new Promise(resolve=>server.close(resolve));
 if(!Number.isSafeInteger(port)||port<1024||port>65535)
   throw Error('SEO F150: ephemeral CI loopback port invalid');
 return port;
}
async function main(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||
    process.env.APP_ENV!=='testing'||
    process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK')
   throw Error('SEO F150: CI-only isolated Docker test required');
 const dir=await mkdtemp(join(tmpdir(),'seo-f150-real-compose-'));
 let yaml=null;
 try{
   const generator=fileURLToPath(new URL(
     '../seo-f144-nginx/create-synthetic-fixture.mjs',import.meta.url
   ));
   execute(process.execPath,[generator,dir]);
   const build=join(dir,'dist');
   const manifest=JSON.parse(
     await readFile(join(dir,'legacy-private.json'),'utf8')
   );
   const nginx=await renderIsolatedNginxStagingConfig({
     migrationInput:manifest,buildDirectory:build
   });
   const conf=join(dir,'nginx-f145-private.conf');
   await writeFile(conf,nginx.privateConfig,{mode:0o644});
   const port=await candidatePort();
   const suffix=(process.env.GITHUB_RUN_ID??'ci').replace(/[^0-9a-z]/gi,'').slice(-15)+
     '-'+(process.env.F150_NODE??'22');
   const project='seo-f150-'+suffix;
   const snapshot={
     sourceType:'operator_supplied_docker_host_inventory_unverified',
     requested:{
       composeProject:project,
       networkName:project+'-net',
       volumeName:project+'-unused',
       loopbackPort:port,memoryLimitMiB:512,cpuLimit:1
     },
     host:{availableMemoryMiB:16000,totalCpu:8,snapshotComplete:true},
     existing:{
       containerNames:['crm-synthetic-untouched'],
       networkNames:['crm-synthetic-net'],
       volumeNames:['crm-synthetic-volume'],
       listeningPorts:[18081],publishedPorts:[18081]
     }
   };
   const candidate=await renderPrivateStagingCompose({
     privateInventory:snapshot,migrationInput:manifest,
     buildDirectory:build,nginxConfigPath:conf
   });
   if(candidate.review.reviewStatus!=='human_compose_safety_review_required'||
      candidate.review.deploymentAuthorized||
      candidate.review.vpsChangesApplied)
     throw Error('SEO F150: unsafe generated Compose authority');
   yaml=join(dir,'private-generated-compose.yml');
   await writeFile(yaml,candidate.privateCompose,{mode:0o600});
   execute('docker',['compose','-f',yaml,'config','--quiet']);
   // The CI runner owns this synthetic project. It is NOT a deployment API.
   execute('docker',['compose','-f',yaml,'up','-d','--wait','--pull','always','--no-build']);
   const cli=fileURLToPath(new URL(
     '../../scripts/run-served-html-staging-qa.mjs',import.meta.url
   ));
   const result=execFileSync(process.execPath,[cli,
     '--gsc',join(dir,'gsc-private.json'),
     '--manifest',join(dir,'legacy-private.json'),
     '--build',build,
     '--out',join(dir,'receipts-private.json'),
     '--port',String(port),
     '--enable-loopback-probe'
   ],{
     encoding:'utf8',timeout:30000,
     env:{...process.env,APP_ENV:'testing',
       SEO_F138_LOOPBACK_STAGING:'YES_I_CONTROL_THIS_LOOPBACK'}
   });
   const report=JSON.parse(result);
   if(report.reviewStatus!=='human_independent_served_html_staging_review_required'||
      report.summary.validHttp301Receipts!==2||
      report.summary.identicalServedHtmlRoutes!==2||
      report.buildDigestMatchedInLocalProxy!==true||
      report.productionReleaseAuthorized!==false)
     throw Error('SEO F150: real Nginx generated Compose did not pass F143');
   process.stdout.write('SEO F150: generated private Compose served correct synthetic 301 and HTML on local-only Nginx\n');
 }finally{
   if(yaml!==null){
     try{execute('docker',['compose','-f',yaml,'down','--volumes','--remove-orphans']);}
     catch{/* cleanup failure remains a CI-only runner teardown concern */}
   }
   await rm(dir,{recursive:true,force:true});
 }
}
main().catch(()=>{
 process.stderr.write('SEO F150: generated isolated Compose functional check failed\n');
 process.exitCode=1;
});
