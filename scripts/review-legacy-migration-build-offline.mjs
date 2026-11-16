#!/usr/bin/env node
/**
 * SEO F129 — staging-operator *read-only* audit of actual compiled HTML and
 * proposed legacy host/scheme/locale 301 mappings. NO publication.
 */
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewCompiledLegacyRedirectTargets}
  from '../src/legacy-redirect-built-site-gate.mjs';
const MAX_BYTES=20*1024*1024;
async function main(){
  if(process.argv.length!==4 || process.argv.slice(2).some(
    x=>typeof x!=='string'||!x||x.startsWith('-')))
    throw Error('invalid args');
  const [source,buildDirectory]=process.argv.slice(2);
  const directory=await lstat(buildDirectory);
  if(!directory.isDirectory()||directory.isSymbolicLink())
    throw Error('unsafe build directory');
  const file=await open(source,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const stat=await file.stat();
    if(!stat.isFile()||stat.size<2||stat.size>MAX_BYTES)
      throw Error('invalid file');
    bytes=await file.readFile();
  }finally{await file.close();}
  if(bytes.length>MAX_BYTES)throw Error('oversized file');
  const planInput=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const result=await reviewCompiledLegacyRedirectTargets({planInput,buildDirectory});
  process.stdout.write(JSON.stringify(result)+'\n');
  process.exitCode=result.reviewStatus==='blocked'?2:0;
}
main().catch(()=>{
  // Do not leak URL, filesystem path, email or source JSON on failure.
  process.stderr.write('SEO F129: invalid or unsafe offline migration review\n');
  process.exitCode=1;
});
