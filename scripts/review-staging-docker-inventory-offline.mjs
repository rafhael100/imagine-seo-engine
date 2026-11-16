#!/usr/bin/env node
/**
 * SEO F147 — privacy-preserving offline Docker inventory review.
 * Never invokes Docker, socket, ssh, shell, networking or writes files.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewIsolatedSeoStagingInventory} from
  '../src/staging-compose-isolation-review.mjs';

const LIMIT=2*1024*1024;
async function main(){
  const args=process.argv.slice(2);
  if(args.length!==1||typeof args[0]!=='string'||
     !args[0]||args[0].startsWith('-'))
    throw Error('SEO F147: exact file argument required');
  const fileInfo=await lstat(args[0]);
  if(!fileInfo.isFile()||fileInfo.isSymbolicLink()||
     fileInfo.size<2||fileInfo.size>LIMIT)
    throw Error('SEO F147: private operator input unsafe');
  const fd=await open(args[0],constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const stat=await fd.stat();
    if(!stat.isFile()||stat.size<2||stat.size>LIMIT)
      throw Error('SEO F147: unsafe file size');
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
