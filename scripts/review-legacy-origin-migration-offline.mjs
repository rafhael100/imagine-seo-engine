#!/usr/bin/env node
/** F127: offline operator preflight for legacy scheme/www/locale URLs. */
import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewLegacyOriginAndLocaleRedirects} from
  '../src/legacy-origin-locale-redirect-review.mjs';

const MAX_INPUT=20*1024*1024;
async function main(){
  if(process.argv.length!==3||!process.argv[2]||
     process.argv[2].startsWith('-'))throw Error('arguments');
  const f=await open(process.argv[2],constants.O_RDONLY|constants.O_NOFOLLOW);
  let raw;
  try{
    const stat=await f.stat();
    if(!stat.isFile()||stat.size<2||stat.size>MAX_INPUT)throw Error('size');
    raw=await f.readFile();
  }finally{await f.close();}
  if(raw.length>MAX_INPUT)throw Error('size');
  const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  const result=reviewLegacyOriginAndLocaleRedirects(input);
  process.stdout.write(JSON.stringify(result)+'\n');
  process.exitCode=result.reviewStatus==='blocked'?2:0;
}
main().catch(()=>{
  // Never print private legacy URL, path, query, token or file name.
  process.stderr.write('SEO F127: unsafe or invalid local redirect manifest\n');
  process.exitCode=1;
});
