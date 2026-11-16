#!/usr/bin/env node
/**
 * SEO F148 — opt-in read-only inventory from a LOCAL Docker daemon and ss.
 * No inspect, ssh, socket writes, container modifications or network probes.
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,open,realpath,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,dirname,sep} from 'node:path';
import {cpus} from 'node:os';
import {buildReadOnlyDockerInventory} from
  './parse-readonly-inventory.mjs';
const execute=promisify(execFile);
const MAX=1024*1024;
async function readCommand(bin,args){
 const result=await execute(bin,args,{
   timeout:5000,maxBuffer:MAX,
   windowsHide:true,shell:false,encoding:'utf8'
 });
 if(result.stderr?.length>MAX||result.stdout?.length>MAX)
   throw Error('SEO F148: overly large local command response');
 return result.stdout.trimEnd();
}
async function main(){
 const a=process.argv.slice(2);
 const fields=['--project','--network','--volume','--port',
   '--memory-mib','--cpus','--out','--read-only-local-host'];
 if(a.length!==15||fields.slice(0,7).some((k,i)=>a[i*2]!==k)||
     a[14]!==fields[7]||
     process.env.SEO_F148_LOCAL_INVENTORY!=='YES_READ_ONLY_DOCKER_HOST')
   throw Error('SEO F148: explicit local-only consent required');
 const [composeProject,networkName,volumeName]=[a[1],a[3],a[5]];
 const [loopbackPort,memoryLimitMiB,cpuLimit]=
   [a[7],a[9],a[11]].map(Number);
 const output=a[13];
 if(!isAbsolute(output)||output.length>2048)throw Error('SEO F148: absolute path required');
 const root=await realpath(process.cwd());
 const parent=await realpath(dirname(output));
 if(parent===root||parent.startsWith(root+sep))
   throw Error('SEO F148: inventory must remain outside public repository');

 // Docker can use remote daemons via DOCKER_HOST or selected context.
 // Only a local Unix socket is acceptable, checked AGAINST the active context.
 const daemon=await readCommand('docker',[
   'context','inspect','--format','{{.Endpoints.docker.Host}}'
 ]);
 const hostEnv=process.env.DOCKER_HOST;
 if(hostEnv&&hostEnv!==daemon)
   throw Error('SEO F148: Docker host environment differs from local context');
 const [containers,networks,volumes,listeners,published,meminfo]=
   await Promise.all([
     readCommand('docker',['container','ls','--all','--format','{{.Names}}']),
     readCommand('docker',['network','ls','--format','{{.Name}}']),
     readCommand('docker',['volume','ls','--format','{{.Name}}']),
     readCommand('ss',['-H','-lnt']),
     readCommand('docker',['ps','--all','--format','{{.Ports}}']),
     readFile('/proc/meminfo','utf8')
   ]);
 const {privateInventory,report}=buildReadOnlyDockerInventory({
   requested:{composeProject,networkName,volumeName,
     loopbackPort,memoryLimitMiB,cpuLimit},
   contextEndpoint:daemon,containers,networks,volumes,listeners,published,
   meminfo,totalCpu:cpus().length
 });
 // The PRIVATE inventory contains names of other tenant services.
 // Never write to checkout or stdout; avoid overwrite of prior evidence.
 const fd=await open(output,
   constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,
   0o600);
 try{
   await fd.writeFile(JSON.stringify(privateInventory)+'\n','utf8');
 }catch{
   await fd.close();
   await rm(output,{force:true});
   throw Error('SEO F148: private inventory write failed');
 }
 await fd.close();
 process.stdout.write(JSON.stringify(report)+'\n');
 if(report.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F148: failed to capture safe local Docker inventory\n');
 process.exitCode=1;
});
