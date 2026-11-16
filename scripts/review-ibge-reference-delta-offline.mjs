#!/usr/bin/env node
/**
 * SEO F155 — compare two private, locally normalized F110 snapshots.
 * Never contact IBGE or print city names/codes, source paths or raw content.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewIbgeNationalReferenceDelta} from
  '../src/ibge-national-reference-delta.mjs';

const MAX=2*1024*1024;
async function readPrivateJson(path){
 if(typeof path!=='string'||path.length>2048||!path.trim())
  throw Error('SEO F155: private path invalid');
 const info=await lstat(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<2||info.size>MAX)
  throw Error('SEO F155: bounded private file required');
 const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 let bytes;
 try{
  const s=await fd.stat();
  if(!s.isFile()||s.size<2||s.size>MAX)
   throw Error('SEO F155: invalid private file size');
  bytes=await fd.readFile();
 }finally{await fd.close();}
 if(bytes.length>MAX)throw Error('SEO F155: input over limit');
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||!args[0]||!args[1]||args[0]===args[1])
  throw Error('SEO F155: two distinct references required');
 const [previousReference,newReference]=await Promise.all([
  readPrivateJson(args[0]),readPrivateJson(args[1])
 ]);
 const result=reviewIbgeNationalReferenceDelta({
  previousReference,newReference
 });
 process.stdout.write(JSON.stringify(result)+'\n');
 if(result.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F155: national edition delta input refused or invalid\n');
 process.exitCode=1;
});
