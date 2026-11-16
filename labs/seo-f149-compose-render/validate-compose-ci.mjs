#!/usr/bin/env node
/**
 * SEO F149 — ONLY in disposable GitHub Actions: compile a synthetic
 * F145 config and F149 Compose, ask Docker Compose to parse its syntax.
 * Never starts/creates containers, networks or volumes.
 */
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderIsolatedNginxStagingConfig} from
  '../seo-f145-nginx-render/render-staging-config.mjs';
import {renderPrivateStagingCompose} from './render-private-compose.mjs';

async function main(){
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true')
   throw Error('SEO F149: CI-only Compose syntax check');
 const dir=await mkdtemp(join(tmpdir(),'seo-f149-compose-ci-'));
 try{
  const generator=fileURLToPath(new URL(
   '../seo-f144-nginx/create-synthetic-fixture.mjs',import.meta.url));
  execFileSync(process.execPath,[generator,dir],{
   stdio:'ignore',timeout:15000
  });
  const plan=JSON.parse(await readFile(join(dir,'legacy-private.json'),'utf8'));
  const build=join(dir,'dist');
  const conf=join(dir,'approved-nginx.conf');
  const output=await renderIsolatedNginxStagingConfig({
   migrationInput:plan,buildDirectory:build
  });
  await writeFile(conf,output.privateConfig,{mode:0o644});
  const privateInventory={
   sourceType:'operator_supplied_docker_host_inventory_unverified',
   requested:{
    composeProject:'seo-f149-ci-private',
    networkName:'seo-f149-ci-net',
    volumeName:'seo-f149-ci-reserved',
    loopbackPort:18341,memoryLimitMiB:512,cpuLimit:1
   },
   host:{availableMemoryMiB:16000,totalCpu:8,snapshotComplete:true},
   existing:{
    containerNames:['crm-test'],
    networkNames:['crm-test-network'],
    volumeNames:['crm-test-volume'],
    listeningPorts:[18081],publishedPorts:[18081]
   }
  };
  const rendered=await renderPrivateStagingCompose({
   privateInventory,migrationInput:plan,
   buildDirectory:build,nginxConfigPath:conf
  });
  const yaml=join(dir,'private-compose.yml');
  await writeFile(yaml,rendered.privateCompose,{mode:0o600});
  execFileSync('docker',['compose','-f',yaml,'config','--quiet'],{
   stdio:'ignore',timeout:15000,
   env:{...process.env,COMPOSE_PROJECT_NAME:'seo-f149-ci-private'}
  });
  if(rendered.review.deploymentAuthorized||
     rendered.review.serviceStarted||
     rendered.review.vpsChangesApplied)
    throw Error('SEO F149: unexpected authority');
  process.stdout.write('SEO F149: Docker Compose parsed synthetic private configuration without deployment\n');
 }finally{await rm(dir,{recursive:true,force:true});}
}
main().catch(()=>{
 process.stderr.write('SEO F149: synthetic Docker Compose syntax validation failed\n');
 process.exitCode=1;
});
