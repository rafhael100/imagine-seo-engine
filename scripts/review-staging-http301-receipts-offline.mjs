#!/usr/bin/env node
/**
 * SEO F135 — privacy-safe CLI for operator-captured HTTP redirect receipts.
 * Completely offline: does not emit headers/URLs, call curl or deploy.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewOfflineLegacyHttp301Receipts} from '../src/legacy-http301-receipt-review.mjs';

const MAX_BYTES=24*1024*1024;
async function main(){
  if(process.argv.length!==3||typeof process.argv[2]!=='string'||
     !process.argv[2]||process.argv[2].startsWith('-'))
    throw Error('bad CLI arguments');
  const filename=process.argv[2];
  const l=await lstat(filename);
  if(!l.isFile()||l.isSymbolicLink()||l.size<2||l.size>MAX_BYTES)
    throw Error('untrusted operator input');
  const handle=await open(filename,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const stat=await handle.stat();
    if(!stat.isFile()||stat.size<2||stat.size>MAX_BYTES)
      throw Error('input size unsafe');
    bytes=await handle.readFile();
  }finally{await handle.close();}
  if(bytes.length>MAX_BYTES)throw Error('input exceeded limit');
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const reviewed=reviewOfflineLegacyHttp301Receipts(data);
  process.stdout.write(JSON.stringify(reviewed)+'\n');
  if(reviewed.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
  // Never forward path, body, URL, header, response text or bearer token.
  process.stderr.write('SEO F135: invalid or unsafe offline HTTP receipt file\n');
  process.exitCode=1;
});
