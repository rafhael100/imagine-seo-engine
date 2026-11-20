#!/usr/bin/env node
/**
 * SEO F153 — read private F110 reference and check MMD 2025 coverage.
 * Entirely offline. Never prints municipality names, codes or paths.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewIbgeMmd2025NationalCoverage} from
 '../src/ibge-national-edition-coverage.mjs';

const MAX=2*1024*1024;
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!args[0]||args[0].startsWith('-'))
  throw Error('SEO F153: private reference argument required');
 const st=await lstat(args[0]);
 if(!st.isFile()||st.isSymbolicLink()||st.size<2||st.size>MAX)
  throw Error('SEO F153: private reference not a bounded file');
 const fd=await open(args[0],constants.O_RDONLY|constants.O_NOFOLLOW);
 let buf;
 try{
  const stat=await fd.stat();
  if(!stat.isFile()||stat.size<2||stat.size>MAX)
   throw Error('SEO F153: unsafe reference size');
  buf=await fd.readFile();
 }finally{await fd.close();}
 if(buf.length>MAX)throw Error('SEO F153: reference too large');
 const reference=JSON.parse(
  new TextDecoder('utf-8',{fatal:true}).decode(buf)
 );
 const result=reviewIbgeMmd2025NationalCoverage({
  reference,editionId:'IBGE_MMD_2025'
 });
 process.stdout.write(JSON.stringify(result)+'\n');
 if(result.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F153: private reference invalid or edition coverage blocked\n');
 process.exitCode=1;
});
