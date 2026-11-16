#!/usr/bin/env node
/**
 * F185 local-only: use ORIGINAL GSC PAGE JSON and ACTUAL audited Astro HTML,
 * write proposed 301 mappings to an explicitly private, new 0600 file.
 * Stdout is sanitized. Output is NEVER a deployable Nginx/Cloudflare config.
 */
import {open,lstat,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {auditStaticSite} from '../src/audit-static.mjs';
import {proposePrivateGscBuildRedirects}
 from '../src/gsc-private-compiled-redirect-drafts.mjs';

// F193: source exports and generated URL manifests must never be written
// anywhere below a Git checkout, even an unrelated worktree or submodule.
// No git invocation or network; .git may be a directory or worktree file.
async function denyGitParentTree(parent){
 let directory=parent;
 while(true){
  try{
   await lstat(join(directory,'.git'));
   throw Error('F193: GSC evidence must remain outside any Git checkout');
  }catch(error){
   if(error?.code!=='ENOENT')
    throw Error('F193: private Git checkout boundary refused');
  }
  const next=dirname(directory);
  if(next===directory)break;
  directory=next;
 }
}
async function privateDirectory(path){
 if(typeof path!=='string'||!isAbsolute(path)||path!==resolve(path)||
    path.length>2048)throw Error('F193: private absolute canonical path required');
 const p=dirname(path);
 const [source,canonical]=await Promise.all([lstat(p),realpath(p)]);
 if(p!==canonical||!source.isDirectory()||source.isSymbolicLink()||
    (process.platform!=='win32'&&((source.mode&0o077)!==0||
      (typeof process.getuid==='function'&&source.uid!==process.getuid()))))
  throw Error('F193: operator-only private folder required');
 await denyGitParentTree(canonical);
 return source;
}

async function loadPrivate(path){
 if(typeof path!=='string'||!path||path.startsWith('-')||path.length>2048)
  throw Error('F185: private page source required');
 await privateDirectory(path);
 const st=await lstat(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size<2||st.size>5*1024*1024||
    (process.platform!=='win32'&&((st.mode&0o077)!==0||
     (typeof process.getuid==='function'&&st.uid!==process.getuid()))))
  throw Error('F185: private page source must be 0600');
 const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const info=await handle.stat();
  if(!info.isFile()||info.size<2||info.size>5*1024*1024||
     info.ino!==st.ino||info.dev!==st.dev)
   throw Error('F185: bounded source required');
  const data=await handle.readFile();
  if(data.length>5*1024*1024)throw Error('F185: oversized source');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
 }finally{await handle.close();}
}
async function writePrivate(path,value){
 if(typeof path!=='string'||!path||path.startsWith('-')||path.length>2048)
  throw Error('F185: private destination path required');
 await privateDirectory(path);
 const bytes=Buffer.from(JSON.stringify(value),'utf8');
 if(bytes.length>5*1024*1024)
  throw Error('F185: private draft oversized');
 const fd=await open(path,
  constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{await fd.writeFile(bytes);}finally{await fd.close();}
}
async function main(){
 if(process.argv.length!==5 ||
   process.argv.slice(2).some(x=>typeof x!=='string'||!x||x.startsWith('-')) ||
   process.argv[2]===process.argv[4])
  throw Error('F185: private GSC, audited build and private destination required');
 const [sourceFile,buildDirectory,draftFile]=process.argv.slice(2);
 const input=await loadPrivate(sourceFile);
 const original=await lstat(buildDirectory);
 const dir=await realpath(buildDirectory);
 const info=await lstat(dir);
 if(original.isSymbolicLink()||!original.isDirectory()||!info.isDirectory())
  throw Error('F185: real local build required');
 const audit=await auditStaticSite(dir,{
  siteUrl:input.canonicalOrigin,
  strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
 });
 if(audit.summary.pages<1||audit.summary.errors>0||
    audit.routes.length!==audit.summary.pages)
  throw Error('F185: invalid audited local Astro build');
 const candidate=proposePrivateGscBuildRedirects({
  gscPageInput:input,targetRoutes:audit.routes
 });
 if(candidate.privateManifest)
  await writePrivate(draftFile,candidate.privateManifest);
 process.stdout.write(JSON.stringify({
  ...candidate.publicReport,
  actualStaticHtmlAudited:true,
  auditedBuildPages:audit.summary.pages,
  staticHtmlWarnings:audit.summary.warnings,
  originalGscSourceAuthenticated:false,
  manifestWrittenToPrivateLocalFile:!!candidate.privateManifest,
  customerDisplayAuthorized:false
 })+'\n');
 process.exitCode=1; // Always HOLD: no mapping is deployed by this CLI.
}
main().catch(()=>{
 process.stderr.write('SEO F185: invalid private GSC page or compiled HTML migration input\n');
 process.exitCode=2;
});
