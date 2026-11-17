#!/usr/bin/env node
/**
 * SEO F125 — repeatable offline pre-publication review of actual static HTML
 * and PT/EN/ES inventory/hreflang, without network or publishing.
 *
 * Never print private input filenames, routes, hashes or raw audit findings.
 */
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewMunicipalMultilingualBuild} from '../src/geo-multilingual-build-gate.mjs';

const MAX_BYTES=24*1024*1024;
async function main(){
  if(process.argv.length!==5 ||
     process.argv.slice(2).some(v=>!v||v.startsWith('-')))
    throw Error('unexpected arguments');
  const [inventoryFile,buildDirectory,siteUrl]=process.argv.slice(2);
  if(siteUrl.length>220 || !/^https:\/\//.test(siteUrl))
    throw Error('invalid offline HTTPS origin');
  const url=new URL(siteUrl);
  if(url.protocol!=='https:'||url.pathname!=='/'||
     url.username||url.password||url.search||url.hash||url.port)
    throw Error('invalid offline HTTPS origin');
  const dir=await lstat(buildDirectory);
  if(!dir.isDirectory()||dir.isSymbolicLink())
    throw Error('unsafe local build directory');
  const file=await open(inventoryFile,constants.O_RDONLY|constants.O_NOFOLLOW);
  let raw;
  try{
    const stats=await file.stat();
    if(!stats.isFile()||stats.size<2||stats.size>MAX_BYTES)
      throw Error('invalid inventory source');
    raw=await file.readFile();
  }finally{await file.close();}
  if(raw.length>MAX_BYTES)throw Error('inventory exceeds bounded file budget');
  const inventoryInput=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  const report=await reviewMunicipalMultilingualBuild({
    inventoryInput,buildDirectory,siteUrl
  });
  process.stdout.write(JSON.stringify(report)+'\n');
  process.exitCode=report.reviewStatus==='blocked'?2:0;
}
main().catch(()=>{
  // Filename, domain and parser error detail may contain private data.
  process.stderr.write('SEO F125: invalid or unsafe offline build review\n');
  process.exitCode=1;
});
