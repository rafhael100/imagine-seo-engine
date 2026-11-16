#!/usr/bin/env node
/**
 * SEO F132 — inspect a PRIVATE operator-supplied GSC PAGE export on disk,
 * emit only the sanitized F131 DTO. No OAuth, network, or production writes.
 */
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewOfflineGscPageOrigins} from '../src/gsc-page-origin-parity.mjs';

const MAX_BYTES=20*1024*1024;
async function main(){
  if(process.argv.length!==3||
     typeof process.argv[2]!=='string'||!process.argv[2]||
     process.argv[2].startsWith('-'))
    throw Error('incorrect CLI arguments');
  const path=process.argv[2];
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<2||stat.size>MAX_BYTES)
    throw Error('untrusted input file');
  const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const real=await handle.stat();
    if(!real.isFile()||real.size<2||real.size>MAX_BYTES)
      throw Error('file size limit');
    bytes=await handle.readFile();
  }finally{await handle.close();}
  if(bytes.length>MAX_BYTES)throw Error('bounded input exceeded');
  const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const response=reviewOfflineGscPageOrigins(JSON.parse(decoded));
  process.stdout.write(JSON.stringify(response)+'\n');
  // A clean result means candidate for HUMAN REVIEW, not authority to deploy.
  if(response.reviewSignals.length || response.summary.redactedRows>0 ||
     response.coverageStatus==='PAGINATION_REMAINS')process.exitCode=2;
}
main().catch(()=>{
  // Do not reveal filenames, URLs, Google account, malformed JSON or secrets.
  process.stderr.write('SEO F132: invalid or unsafe offline GSC page input\n');
  process.exitCode=1;
});
