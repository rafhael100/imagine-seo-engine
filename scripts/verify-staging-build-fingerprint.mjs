#!/usr/bin/env node
/** SEO F140 — verify a private staging proxy's local build claim via HEAD. */
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute} from 'node:path';
import {attestLocalStagingBuild} from
  '../labs/seo-f140-build-attestation/verify-loopback-build.mjs';

const MAX=20*1024*1024;
async function privateManifest(path){
  if(!isAbsolute(path)||path.length>2048)
    throw Error('SEO F140: absolute manifest required');
  const info=await lstat(path);
  if(!info.isFile()||info.isSymbolicLink()||
     info.size<2||info.size>MAX)
    throw Error('SEO F140: private manifest required');
  const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  let body;
  try{
    const st=await file.stat();
    if(!st.isFile()||st.size<2||st.size>MAX)
      throw Error('SEO F140: unsafe manifest');
    body=await file.readFile();
  }finally{await file.close();}
  if(body.length>MAX)throw Error('SEO F140: too many bytes');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));
}
async function main(){
  const args=process.argv.slice(2);
  if(args.length!==7||
     args[0]!=='--manifest'||args[2]!=='--build'||
     args[4]!=='--port'||args[6]!=='--enable-loopback-probe'||
     !/^\d{4,5}$/.test(args[5])||
     process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
     !['staging','testing'].includes(process.env.APP_ENV))
    throw Error('SEO F140: explicit staging opt-in required');
  const directory=args[3];
  if(!isAbsolute(directory)||directory.length>2048)
    throw Error('SEO F140: absolute build directory required');
  const st=await lstat(directory);
  if(!st.isDirectory()||st.isSymbolicLink())
    throw Error('SEO F140: unsafe build root');

  const reviewed=await attestLocalStagingBuild({
    migrationInput:await privateManifest(args[1]),
    buildDirectory:directory,
    stagingPort:Number(args[5]),
    timeoutMs:3000
  });
  process.stdout.write(JSON.stringify(reviewed)+'\n');
  if(reviewed.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
  process.stderr.write('SEO F140: invalid private build or isolated staging claim\n');
  process.exitCode=1;
});
