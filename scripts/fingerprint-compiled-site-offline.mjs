#!/usr/bin/env node
/** SEO F140 — deterministic local dist digest; no network, no filenames. */
import {fingerprintCompiledSite} from '../src/compiled-site-fingerprint.mjs';
async function main(){
  const args=process.argv.slice(2);
  if(args.length!==1||args[0].startsWith('-')||!args[0])
    throw Error('SEO F140: explicit build directory required');
  const result=await fingerprintCompiledSite(args[0]);
  process.stdout.write(JSON.stringify(result)+'\n');
}
main().catch(()=>{
  process.stderr.write('SEO F140: unsafe or unreadable compiled build\n');
  process.exitCode=1;
});
