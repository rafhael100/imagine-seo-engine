#!/usr/bin/env node
/**
 * SEO F154 — verify a private F117 reference+receipt and check F153
 * municipal coverage, offline, without logging raw IBGE names or codes.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewIbgeReceiptAndNationalCoverage} from
  '../src/ibge-receipt-national-crosscheck.mjs';

async function readPrivateText(path,max){
 if(typeof path!=='string'||path.length>2048)
  throw Error('SEO F154: bounded private path required');
 const s=await lstat(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size<2||s.size>max)
  throw Error('SEO F154: unsafe private source');
 const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 let bytes;
 try{
  const stat=await fd.stat();
  if(!stat.isFile()||stat.size<2||stat.size>max)
   throw Error('SEO F154: unsafe source size');
  bytes=await fd.readFile();
 }finally{await fd.close();}
 if(bytes.length>max)throw Error('SEO F154: oversized source');
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||!args[0]||!args[1]||args[0]===args[1])
  throw Error('SEO F154: two distinct private files required');
 const [reference,receiptText]=await Promise.all([
  readPrivateText(args[0],2*1024*1024),
  readPrivateText(args[1],8*1024)
 ]);
 const captureReceipt=JSON.parse(receiptText);
 const report=reviewIbgeReceiptAndNationalCoverage({
  normalizedReferenceText:reference,captureReceipt
 });
 process.stdout.write(JSON.stringify(report)+'\n');
 if(report.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F154: private IBGE proof or national coverage rejected\n');
 process.exitCode=1;
});
