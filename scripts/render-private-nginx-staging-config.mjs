#!/usr/bin/env node
/** SEO F145 — render a private Nginx staging conf, never deploy or print it. */
import {open,lstat,realpath,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,isAbsolute,resolve,sep} from 'node:path';
import {renderIsolatedNginxStagingConfig} from
  '../labs/seo-f145-nginx-render/render-staging-config.mjs';

async function main(){
  const argv=process.argv.slice(2);
  if(argv.length!==6||argv[0]!=='--manifest'||
     argv[2]!=='--build'||argv[4]!=='--out')
    throw Error('SEO F145: exact CLI arguments required');
  const [manifest,buildDir,output]=[argv[1],argv[3],argv[5]];
  if(![manifest,buildDir,output].every(p=>
      typeof p==='string'&&isAbsolute(p)&&p.length<2048))
    throw Error('SEO F145: private absolute paths required');
  const root=await realpath(process.cwd());
  const outParentPath=dirname(output),inputParentPath=dirname(manifest);
  const [parent,inputParent,outMeta,inMeta]=await Promise.all([
    realpath(outParentPath),realpath(inputParentPath),
    lstat(outParentPath),lstat(inputParentPath)
  ]);
  if(parent===root||parent.startsWith(root+sep))
    throw Error('SEO F145: cannot write nginx conf inside Git checkout');
  // F189: a 0644 Nginx file is readable to a nonroot container. It must
  // NEVER be placed under a shared/traversable host directory, because its
  // legacy routes and hostnames are PRIVATE operator staging material.
  // The container receives only the individual file as a read-only bind.
  if([outMeta,inMeta].some(x=>!x.isDirectory()||x.isSymbolicLink())||
     parent!==resolve(outParentPath)||inputParent!==resolve(inputParentPath)||
     (process.platform!=='win32'&&
      [outMeta,inMeta].some(x=>(x.mode&0o077)!==0||
        (typeof process.getuid==='function'&&x.uid!==process.getuid()))))
    throw Error('SEO F189: input and output directories must be operator-private 0700');
  const meta=await lstat(manifest);
  if(!meta.isFile()||meta.isSymbolicLink()||meta.size<2||
     meta.size>4*1024*1024||
     (process.platform!=='win32'&&
       ((meta.mode&0o077)!==0||
        (typeof process.getuid==='function'&&meta.uid!==process.getuid()))))
    throw Error('SEO F145: untrusted private manifest');
  const file=await open(manifest,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const s=await file.stat();
    if(!s.isFile()||s.size<2||s.size>4*1024*1024||
       s.ino!==meta.ino||s.dev!==meta.dev||
       (process.platform!=='win32'&&(s.mode&0o077)!==0))
      throw Error('SEO F145: bounded input required');
    bytes=await file.readFile();
  }finally{await file.close();}
  if(bytes.length>4*1024*1024)
    throw Error('SEO F145: input exceeds limit');
  const migrationInput=JSON.parse(
    new TextDecoder('utf-8',{fatal:true}).decode(bytes)
  );
  const result=await renderIsolatedNginxStagingConfig({
    migrationInput,buildDirectory:buildDir
  });
  // Config may contain private historical URLs; 0644 within a private
  // host directory supports the nonroot Nginx (uid 101) bind mount.
  // Ensure parent directory is operator-controlled/private separately.
  const f=await open(output,
    constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,
    0o644);
  try{await f.writeFile(result.privateConfig,'utf8');}
  catch{
    await f.close();await rm(output,{force:true});
    throw Error('SEO F145: failed writing private config');
  }
  await f.close();
  process.stdout.write(JSON.stringify(result.review)+'\n');
}
main().catch(()=>{
  process.stderr.write('SEO F145: private Nginx staging config rejected or failed\n');
  process.exitCode=1;
});
