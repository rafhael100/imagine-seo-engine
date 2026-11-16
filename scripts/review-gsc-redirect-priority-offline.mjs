#!/usr/bin/env node
/**
 * SEO F183: private offline GSC PAGE-to-redirect priority review.
 * No Google calls, URL emission, credentials, deployment or publishing.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {prioritizeOfflineGscLegacyMigration}
 from '../src/gsc-legacy-migration-priority.mjs';

async function readPrivate(path,max){
 if(typeof path!=='string'||!path||path.startsWith('-')||path.length>2048)
  throw Error('F183: private input path required');
 const stat=await lstat(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<2||
    stat.size>max||(process.platform!=='win32'&&(stat.mode&0o077)!==0))
  throw Error('F183: private regular 0600 file required');
 const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const now=await handle.stat();
  if(!now.isFile()||now.size<2||now.size>max)
   throw Error('F183: private file changed');
  const data=await handle.readFile();
  if(data.length>max)throw Error('F183: input too large');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
 }finally{await handle.close();}
}
async function main(){
 if(process.argv.length!==4||process.argv[2]===process.argv[3])
  throw Error('F183: two distinct private inputs required');
 const [gscPageInput,legacyMigrationInput]=await Promise.all([
  readPrivate(process.argv[2],5*1024*1024),
  readPrivate(process.argv[3],5*1024*1024)
 ]);
 const output=prioritizeOfflineGscLegacyMigration({
  gscPageInput,legacyMigrationInput
 });
 process.stdout.write(JSON.stringify(output)+'\n');
 if(output.metricsWithheld||output.paginationIncomplete||
    output.atRiskPageRows>0||
    output.originalRedirectManifestReviewStatus==='blocked')
  process.exitCode=1;
}
main().catch(()=>{
 // Never echo file names, URLs, raw Google rows, or exception details.
 process.stderr.write('SEO F183: invalid or unsafe private GSC/301 inputs\n');
 process.exitCode=2;
});
