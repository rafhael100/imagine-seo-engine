#!/usr/bin/env node
/**
 * SEO F147/F196 — privacy-preserving read-only Docker inventory review.
 * No Docker/socket/SSH/network calls, writes or release authority. Topology
 * and ports are private data even when they contain no passwords.
 */
import {lstat,open,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {reviewIsolatedSeoStagingInventory} from
 '../src/staging-compose-isolation-review.mjs';

const LIMIT=2*1024*1024;
async function privateSource(path){
 if(typeof path!=='string'||!isAbsolute(path)||path!==resolve(path)||
    path.length>2048)throw Error('SEO F196: private absolute source required');
 const parent=dirname(path);
 const [folder,canonical]=await Promise.all([lstat(parent),realpath(parent)]);
 if(parent!==canonical||!folder.isDirectory()||folder.isSymbolicLink()||
    (process.platform!=='win32'&&
     ((folder.mode&0o077)!==0||
      (typeof process.getuid==='function'&&folder.uid!==process.getuid()))))
  throw Error('SEO F196: private 0700 operator directory required');
 // Prevent accidental capture of private network topology inside Git,
 // including worktrees and submodules with a .git file rather than folder.
 let current=canonical;
 while(true){
  try{
   await lstat(join(current,'.git'));
   throw Error('SEO F196: source is inside a Git checkout');
  }catch(error){
   if(error?.code!=='ENOENT')
    throw Error('SEO F196: refusing private source under Git');
  }
  const next=dirname(current);
  if(next===current)break;
  current=next;
 }
 const file=await lstat(path);
 if(!file.isFile()||file.isSymbolicLink()||
    file.size<2||file.size>LIMIT||
    (process.platform!=='win32'&&
     ((file.mode&0o077)!==0||
      (typeof process.getuid==='function'&&file.uid!==process.getuid()))))
  throw Error('SEO F196: private 0600 input required');
 return file;
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1)
  throw Error('SEO F147: exact file argument required');
 const fileInfo=await privateSource(args[0]);
 const fd=await open(args[0],constants.O_RDONLY|constants.O_NOFOLLOW);
 let bytes;
 try{
  const info=await fd.stat();
  if(!info.isFile()||info.size<2||info.size>LIMIT||
     info.ino!==fileInfo.ino||info.dev!==fileInfo.dev)
   throw Error('SEO F196: private file replaced during read');
  bytes=await fd.readFile();
 }finally{await fd.close();}
 if(bytes.length>LIMIT)throw Error('SEO F147: too many bytes');
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 const report=reviewIsolatedSeoStagingInventory(data);
 process.stdout.write(JSON.stringify(report)+'\n');
 if(report.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F147: invalid or unsafe private Docker inventory\n');
 process.exitCode=1;
});
