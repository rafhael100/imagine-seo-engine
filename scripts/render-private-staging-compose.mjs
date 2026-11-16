#!/usr/bin/env node
/**
 * SEO F149 — generate PRIVATE Compose YAML only, never run Docker.
 * Input inventory and redirect manifest remain local, not printed.
 */
import {lstat,open,realpath,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,dirname,sep} from 'node:path';
import {renderPrivateStagingCompose} from
  '../labs/seo-f149-compose-render/render-private-compose.mjs';

const LIMIT=4*1024*1024;
async function privateJson(path){
  if(!isAbsolute(path)||path.length>2048)
    throw Error('SEO F149: absolute private input required');
  const file=await lstat(path);
  if(!file.isFile()||file.isSymbolicLink()||
     file.size<2||file.size>LIMIT)throw Error('SEO F149: invalid input file');
  const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  let bytes;
  try{
    const stat=await fd.stat();
    if(!stat.isFile()||stat.size<2||stat.size>LIMIT)
      throw Error('SEO F149: input too large');
    bytes=await fd.readFile();
  }finally{await fd.close();}
  if(bytes.length>LIMIT)throw Error('SEO F149: input exceeded bound');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function main(){
  const a=process.argv.slice(2);
  if(a.length!==10||a[0]!=='--inventory'||a[2]!=='--manifest'||
     a[4]!=='--build'||a[6]!=='--nginx-conf'||a[8]!=='--out')
    throw Error('SEO F149: exact five operator paths required');
  const output=a[9];
  if(!isAbsolute(output)||output.length>2048)
    throw Error('SEO F149: absolute output required');
  const checkout=await realpath(process.cwd());
  const parent=await realpath(dirname(output));
  if(parent===checkout||parent.startsWith(checkout+sep))
    throw Error('SEO F149: private Compose cannot be written into Git checkout');
  const [privateInventory,migrationInput]=await Promise.all([
    privateJson(a[1]),privateJson(a[3])
  ]);
  const result=await renderPrivateStagingCompose({
    privateInventory,migrationInput,buildDirectory:a[5],
    nginxConfigPath:a[7]
  });
  const fd=await open(output,
    constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,
    0o600);
  try{await fd.writeFile(result.privateCompose,'utf8');}
  catch{
    await fd.close();
    await rm(output,{force:true});
    throw Error('SEO F149: cannot create private Compose file');
  }
  await fd.close();
  process.stdout.write(JSON.stringify(result.review)+'\n');
}
main().catch(()=>{
  process.stderr.write('SEO F149: isolated private staging Compose was not generated\n');
  process.exitCode=1;
});
