#!/usr/bin/env node
/**
 * SEO F122 — offline read-only operator review of municipal i18n coverage.
 * Never prints supplied paths, page text, municipality codes or digests.
 */
import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewMunicipalI18nParity} from '../src/geo-i18n-parity-review.mjs';

const MAX_INPUT_BYTES=24*1024*1024;
async function main(){
  if(process.argv.length!==3 || typeof process.argv[2]!=='string' ||
     !process.argv[2] || process.argv[2].startsWith('-'))
    throw Error('invalid arguments');
  const handle=await open(process.argv[2],constants.O_RDONLY|constants.O_NOFOLLOW);
  let raw;
  try{
    const info=await handle.stat();
    if(!info.isFile()||info.size<2||info.size>MAX_INPUT_BYTES)
      throw Error('input size or type refused');
    raw=await handle.readFile();
  }finally{await handle.close();}
  if(raw.length>MAX_INPUT_BYTES)throw Error('input exceeded limit');
  const inventory=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  const report=reviewMunicipalI18nParity(inventory);
  process.stdout.write(JSON.stringify(report)+'\n');
  if(report.reviewStatus==='corrections_required')process.exitCode=2;
}
main().catch(()=>{
  // Deliberately suppress untrusted filenames, body text and parser details.
  process.stderr.write('SEO F122: invalid or unsafe offline inventory\n');
  process.exitCode=1;
});
