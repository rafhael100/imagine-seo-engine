#!/usr/bin/env node
/** F137 — private, read-only execution of GSC + HTTP301 + actual HTML gate. */
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewOfflineMigrationCrossEvidence} from
  '../src/migration-cross-evidence-release-gate.mjs';

const LIMIT=32*1024*1024;
async function main(){
  if(process.argv.length!==3||typeof process.argv[2]!=='string'||
     !process.argv[2]||process.argv[2].startsWith('-'))
    throw Error('invalid CLI args');
  const inputPath=process.argv[2];
  const info=await lstat(inputPath);
  if(!info.isFile()||info.isSymbolicLink()||
     info.size<2||info.size>LIMIT)
    throw Error('untrusted input');
  const file=await open(inputPath,constants.O_RDONLY|constants.O_NOFOLLOW);
  let raw;
  try{
    const stat=await file.stat();
    if(!stat.isFile()||stat.size<2||stat.size>LIMIT)
      throw Error('oversized input');
    raw=await file.readFile();
  }finally{await file.close();}
  if(raw.length>LIMIT)throw Error('too many bytes');
  const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  // The directory is private and must not be followed through a top-level
  // symlink. F0/F128 perform their own bounded local crawl checks.
  if(typeof input?.buildDirectory!=='string')throw Error('missing directory');
  const build=await lstat(input.buildDirectory);
  if(!build.isDirectory()||build.isSymbolicLink())
    throw Error('unsafe HTML build root');
  const result=await reviewOfflineMigrationCrossEvidence(input);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
  process.stderr.write('SEO F137: invalid or unsafe private migration QA input\n');
  process.exitCode=1;
});
