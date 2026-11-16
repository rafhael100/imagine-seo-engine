#!/usr/bin/env node
/**
 * SEO F138 — operator-only loopback staging HEAD capture.
 * The PRIVATE receipt is saved with mode 0600 OUTSIDE the Git checkout.
 * STDOUT and stderr never include a URL, path, response header or IP.
 */
import {lstat,open,realpath,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,isAbsolute,resolve,sep} from 'node:path';
import {captureLoopbackStaging301} from
  '../src/legacy-301-loopback-staging-capture.mjs';

const MAX_INPUT=20*1024*1024;
async function main(){
  const args=process.argv.slice(2);
  if(args.length!==7||args[0]!=='--manifest'||args[2]!=='--out'||
     args[4]!=='--port'||args[6]!=='--enable-loopback-probe'||
     !/^\d{4,5}$/.test(args[5]))
    throw Error('SEO F138: explicit manifest/out/port/opt-in required');

  const [manifestPath,outputPath]=[args[1],args[3]];
  const port=Number(args[5]);
  if(!isAbsolute(outputPath)||outputPath.length>2048||
     !isAbsolute(manifestPath)||manifestPath.length>2048)
    throw Error('SEO F138: absolute private paths required');
  const checkout=await realpath(process.cwd());
  const parent=await realpath(dirname(outputPath));
  if(parent===checkout||parent.startsWith(checkout+sep))
    throw Error('SEO F138: output must remain outside Git checkout');

  const info=await lstat(manifestPath);
  if(!info.isFile()||info.isSymbolicLink()||
     info.size<2||info.size>MAX_INPUT)
    throw Error('SEO F138: invalid private manifest');
  const input=await open(manifestPath,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const stat=await input.stat();
    if(!stat.isFile()||stat.size<2||stat.size>MAX_INPUT)
      throw Error('SEO F138: unsafe manifest size');
    bytes=await input.readFile();
  }finally{await input.close();}
  if(bytes.length>MAX_INPUT)throw Error('SEO F138: manifest too large');
  const plan=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const outcome=await captureLoopbackStaging301({
    migrationInput:plan,stagingPort:port,timeoutMs:3000
  });

  // Atomic create-exclusively. Never overwrite or truncate earlier evidence.
  const output=await open(outputPath,
    constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,
    0o600);
  try{
    await output.writeFile(JSON.stringify({
      migrationInput:plan,capture:outcome.capture
    })+'\n',{encoding:'utf8'});
  }catch{
    await output.close();
    await rm(outputPath,{force:true});
    throw Error('SEO F138: private capture not written');
  }
  await output.close();

  process.stdout.write(JSON.stringify(outcome.review)+'\n');
  if(outcome.review.reviewStatus==='blocked')process.exitCode=2;
}
main().catch(()=>{
  process.stderr.write('SEO F138: private loopback staging capture refused or failed\n');
  process.exitCode=1;
});
