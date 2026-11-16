#!/usr/bin/env node
/**
 * SEO F139 — opt-in, bounded PRIVATE CLI for the isolated F138 HTTP lab.
 * Explicitly outside src/ and scripts/ to retain F77 offline policy.
 * Requests never leave 127.0.0.1 and redirects are never followed.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {probeLoopbackLegacyRedirects} from './probe-loopback.mjs';

const MAX_BYTES=8*1024*1024;
async function main(){
  if(process.argv.length!==3||typeof process.argv[2]!=='string'||
     !process.argv[2]||process.argv[2].startsWith('-')||
     process.env.SEO_F138_ALLOW_LOCAL_HEAD!=='1')
    throw Error('operator approval is absent');
  const filename=process.argv[2];
  const info=await lstat(filename);
  if(!info.isFile()||info.isSymbolicLink()||
     info.size<2||info.size>MAX_BYTES)throw Error('private input invalid');
  const handle=await open(filename,constants.O_RDONLY|constants.O_NOFOLLOW);
  let raw;
  try{
    const size=await handle.stat();
    if(!size.isFile()||size.size<2||size.size>MAX_BYTES)
      throw Error('unsafe file');
    raw=await handle.readFile();
  }finally{await handle.close();}
  if(raw.length>MAX_BYTES)throw Error('oversized input');
  const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  const report=await probeLoopbackLegacyRedirects(input);
  process.stdout.write(JSON.stringify(report)+'\n');
  if(report.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
  // Never print raw URLs, ports, credentials, body or filenames.
  process.stderr.write('SEO F139: unsafe or unavailable approved local HEAD review\n');
  process.exitCode=1;
});
