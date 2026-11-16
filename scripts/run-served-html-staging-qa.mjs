#!/usr/bin/env node
/**
 * SEO F143 — one-command GSC + built HTML + loopback 301 review.
 * PRIVATE inputs/output; stdout prints only a sanitized summary.
 */
import {open,lstat,realpath,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,isAbsolute,sep} from 'node:path';
import {runServedHtmlAttestedStagingQa} from
  '../labs/seo-f143-full-served-gate/run-served-html-staging-gate.mjs';

const MAX_INPUT=20*1024*1024;
async function safeJson(path){
  if(!isAbsolute(path)||path.length>2048)
    throw Error('SEO F143: private absolute path required');
  const before=await lstat(path);
  if(!before.isFile()||before.isSymbolicLink()||
     before.size<2||before.size>MAX_INPUT)
    throw Error('SEO F143: input file unsafe');
  const f=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  let raw;
  try{
    const st=await f.stat();
    if(!st.isFile()||st.size<2||st.size>MAX_INPUT)
      throw Error('SEO F143: invalid input size');
    raw=await f.readFile();
  }finally{await f.close();}
  if(raw.length>MAX_INPUT)throw Error('SEO F143: input oversized');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
}
async function main(){
  const a=process.argv.slice(2);
  if(a.length!==11||
     a[0]!=='--gsc'||a[2]!=='--manifest'||
     a[4]!=='--build'||a[6]!=='--out'||
     a[8]!=='--port'||a[10]!=='--enable-loopback-probe'||
     !/^\d{4,5}$/.test(a[9])||
     !['staging','testing'].includes(process.env.APP_ENV)||
     process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK')
    throw Error('SEO F143: explicit staging opt-in and arguments required');

  const [gscPath,manifestPath,buildDirectory,outPath]=[a[1],a[3],a[5],a[7]];
  if(!isAbsolute(buildDirectory)||!isAbsolute(outPath)||
     buildDirectory.length>2048||outPath.length>2048)
    throw Error('SEO F143: private absolute paths required');

  const checkout=await realpath(process.cwd());
  const outputParent=await realpath(dirname(outPath));
  if(outputParent===checkout||outputParent.startsWith(checkout+sep))
    throw Error('SEO F143: refuse Git checkout output');
  const build=await lstat(buildDirectory);
  if(!build.isDirectory()||build.isSymbolicLink())
    throw Error('SEO F143: unsafe build directory');

  const [gscPageInput,migrationInput]=await Promise.all([
    safeJson(gscPath),safeJson(manifestPath)
  ]);
  const outcome=await runServedHtmlAttestedStagingQa({
    gscPageInput,migrationInput,buildDirectory,
    stagingPort:Number(a[9]),timeoutMs:3000
  });
  if(outcome.capture!==null){
    const output=await open(outPath,
      constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,
      0o600);
    try{
      await output.writeFile(JSON.stringify({
        migrationInput,capture:outcome.capture
      })+'\n');
    }catch{
      await output.close();
      await rm(outPath,{force:true});
      throw Error('SEO F143: receipt write failed');
    }
    await output.close();
  }
  process.stdout.write(JSON.stringify(outcome.report)+'\n');
  if(outcome.report.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
  // Never log paths, GSC rows, Location headers, tokens or hostnames.
  process.stderr.write('SEO F143: isolated staging QA failed or rejected unsafe input\n');
  process.exitCode=1;
});
