/**
 * F179: bound original private DTB CSV and editorial draft input.
 * File paths, city names, page copy and evidence text never go to stdout.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewDraftBatchAgainstPinnedDtb} from '../src/geo-pinned-official-editorial-gate.mjs';

async function readPrivate(path,max){
 if(typeof path!=='string'||!path||path.length>2048||path.startsWith('-'))
  throw Error('F179: invalid private file path');
 const info=await lstat(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<2||
    info.size>max||(process.platform!=='win32'&&(info.mode&0o077)!==0))
  throw Error('F179: private regular 0600 file required');
 const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const check=await fd.stat();
  if(!check.isFile()||check.size>max||check.size<2)
   throw Error('F179: invalid bounded private file');
  const contents=await fd.readFile();
  if(contents.length>max)throw Error('F179: oversized private content');
  return new TextDecoder('utf-8',{fatal:true}).decode(contents);
 }finally{await fd.close();}
}
async function main(){
 if(process.argv.length!==4||process.argv[2]===process.argv[3])
  throw Error('F179: two distinct private input files required');
 const csv=await readPrivate(process.argv[2],1024*1024);
 const draft=JSON.parse(await readPrivate(process.argv[3],512*1024));
 const result=reviewDraftBatchAgainstPinnedDtb({
  normalizedDtbCsv:csv,draftBatchInput:draft
 });
 process.stdout.write(JSON.stringify(result)+'\n');
 if(result.blockedDrafts>0)process.exitCode=1;
}
main().catch(()=>{
 process.stderr.write('F179: private verified DTB and editorial review refused\n');
 process.exitCode=2;
});
