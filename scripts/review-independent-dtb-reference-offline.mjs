#!/usr/bin/env node
/**
 * SEO F156 — two private operator-selected files; NO internet and
 * NO claim that the DTB spreadsheet/CSV was really obtained from IBGE.
 * Original workbook and chain of custody remain with the operator.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewIndependentDtbMunicipalCrosscheck} from
 '../src/ibge-independent-dtb-crosscheck.mjs';

async function privateRead(path,max){
 if(typeof path!=='string'||!path.trim()||path.length>2048)
  throw Error('SEO F156: private file name invalid');
 const stat=await lstat(path);
 if(stat.isSymbolicLink()||!stat.isFile()||
    stat.size<2||stat.size>max)
  throw Error('SEO F156: unsafe private file');
 const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 let bytes;
 try{
  const info=await fd.stat();
  if(!info.isFile()||info.size<2||info.size>max)
   throw Error('SEO F156: private file size invalid');
  bytes=await fd.readFile();
 }finally{await fd.close();}
 if(bytes.length>max)throw Error('SEO F156: oversize');
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||!args[0]||!args[1]||args[0]===args[1])
  throw Error('SEO F156: distinct private reference and DTB required');
 const [referenceText,normalizedDtbCsv]=await Promise.all([
  privateRead(args[0],2*1024*1024),
  privateRead(args[1],1024*1024)
 ]);
 const localityReference=JSON.parse(referenceText);
 const review=reviewIndependentDtbMunicipalCrosscheck({
  localityReference,normalizedDtbCsv,editionId:'IBGE_DTB_2025'
 });
 process.stdout.write(JSON.stringify(review)+'\n');
 if(review.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write('SEO F156: private DTB crosscheck input invalid or refused\n');
 process.exitCode=1;
});
