#!/usr/bin/env node
/**
 * SEO F149 — generate PRIVATE Compose YAML only, never run Docker.
 * Input inventory and redirect manifest remain local, not printed.
 */
import {lstat,open,realpath,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,dirname,resolve,join} from 'node:path';
import {renderPrivateStagingCompose} from
  '../labs/seo-f149-compose-render/render-private-compose.mjs';

const LIMIT=4*1024*1024;
// F194: topology inventory, legacy URL manifests and generated Compose may
// reveal operator infrastructure. They must live under private 0700 ownership
// and NEVER anywhere in a tracked checkout or submodule.
async function privateOperatorFolder(path){
  if(typeof path!=='string'||!isAbsolute(path)||path!==resolve(path)||
     path.length>2048)throw Error('SEO F194: canonical absolute file path required');
  const folder=dirname(path);
  const [meta,canonical]=await Promise.all([lstat(folder),realpath(folder)]);
  if(folder!==canonical||!meta.isDirectory()||meta.isSymbolicLink()||
     (process.platform!=='win32'&&
      ((meta.mode&0o077)!==0||
       (typeof process.getuid==='function'&&meta.uid!==process.getuid()))))
    throw Error('SEO F194: operator-only 0700 folder required');
  let current=canonical;
  while(true){
    try{
      await lstat(join(current,'.git'));
      throw Error('SEO F194: Git checkout cannot store staging evidence');
    }catch(e){
      if(e?.code!=='ENOENT')
        throw Error('SEO F194: Git/worktree evidence custody refused');
    }
    const next=dirname(current);
    if(next===current)break;
    current=next;
  }
}
async function privateJson(path){
  await privateOperatorFolder(path);
  const file=await lstat(path);
  if(!file.isFile()||file.isSymbolicLink()||
     file.size<2||file.size>LIMIT||
     (process.platform!=='win32'&&
      ((file.mode&0o077)!==0||
       (typeof process.getuid==='function'&&file.uid!==process.getuid()))))
    throw Error('SEO F149: invalid private input file');
  const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const stat=await fd.stat();
    if(!stat.isFile()||stat.size<2||stat.size>LIMIT||
       stat.ino!==file.ino||stat.dev!==file.dev)
      throw Error('SEO F149: unsafe bounded input');
    bytes=await fd.readFile();
  }finally{await fd.close();}
  if(bytes.length>LIMIT)throw Error('SEO F149: input exceeded bound');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function main(){
  const a=process.argv.slice(2);
  if(a.length!==10||a[0]!=='--inventory'||a[2]!=='--manifest'||
     a[4]!=='--build'||a[6]!=='--nginx-conf'||a[8]!=='--out')
    throw Error('SEO F149: exact five operator paths required');
  const output=a[9];
  if(!isAbsolute(output)||output.length>2048)
    throw Error('SEO F149: absolute output required');
  await privateOperatorFolder(output);
  const [privateInventory,migrationInput]=await Promise.all([
    privateJson(a[1]),privateJson(a[3])
  ]);
  const result=await renderPrivateStagingCompose({
    privateInventory,migrationInput,buildDirectory:a[5],
    nginxConfigPath:a[7]
  });
  const fd=await open(output,
    constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,
    0o600);
  try{await fd.writeFile(result.privateCompose,'utf8');}
  catch{
    await fd.close();
    await rm(output,{force:true});
    throw Error('SEO F149: cannot create private Compose file');
  }
  await fd.close();
  process.stdout.write(JSON.stringify(result.review)+'\n');
}
main().catch(()=>{
  process.stderr.write('SEO F149: isolated private staging Compose was not generated\n');
  process.exitCode=1;
});
