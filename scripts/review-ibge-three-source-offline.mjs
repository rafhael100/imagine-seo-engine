#!/usr/bin/env node
/**
 * SEO F157 — one private operator command for 3 independent source
 * checks. Does not fetch, convert XLS, authenticate editions or publish.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewThreeSourceIbgeEvidence} from
 '../src/ibge-three-source-release-review.mjs';

async function readPrivate(path,max){
 if(typeof path!=='string'||!path.trim()||path.length>2048)
  throw Error('SEO F157: bounded path required');
 const s=await lstat(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size<2||s.size>max)
  throw Error('SEO F157: unsafe source');
 const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 let bytes;
 try{
  const inner=await fd.stat();
  if(!inner.isFile()||inner.size<2||inner.size>max)
   throw Error('SEO F157: unsafe file');
  bytes=await fd.readFile();
 }finally{await fd.close();}
 if(bytes.length>max)throw Error('SEO F157: size exceeded');
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==3||args.some(x=>typeof x!=='string'||!x)||
    new Set(args).size!==3)
  throw Error('SEO F157: three distinct private files required');
 const [normalizedReferenceText,receiptText,normalizedDtbCsv]=
  await Promise.all([
   readPrivate(args[0],2*1024*1024),
   readPrivate(args[1],8*1024),
   readPrivate(args[2],1024*1024)
  ]);
 const captureReceipt=JSON.parse(receiptText);
 const report=reviewThreeSourceIbgeEvidence({
  normalizedReferenceText,captureReceipt,normalizedDtbCsv
 });
 process.stdout.write(JSON.stringify(report)+'\n');
 if(report.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F157: official source crosscheck refused private evidence\n');
 process.exitCode=1;
});
