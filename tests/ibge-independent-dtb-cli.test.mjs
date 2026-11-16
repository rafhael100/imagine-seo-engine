import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL(
  '../scripts/review-independent-dtb-reference-offline.mjs',import.meta.url));
const run=(a,b)=>spawnSync(process.execPath,[cli,a,b],{
 encoding:'utf8',timeout:12000,maxBuffer:1024*1024
});
test('F156 CLI refuses untrusted input and symlinks without leaking content',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f156-'));
 try{
  const ref=join(dir,'municipal-private.json'),
    dtb=join(dir,'dtb-private.csv'),
    alias=join(dir,'symlink-private.csv');
  await writeFile(ref,'{"secret":"REAL PRIVATE CITY"}');
  await writeFile(dtb,'ibgeCode;state;city\n5300108;DF;Brasília\n');
  await symlink(dtb,alias);
  for(const filename of [dtb,alias]){
   const result=run(ref,filename);
   assert.equal(result.status,1);
   assert.equal(result.stdout,'');
   assert.equal(result.stderr,
    'SEO F156: private DTB crosscheck input invalid or refused\n');
   assert.doesNotMatch(result.stderr,/REAL PRIVATE CITY|Brasília|5300108/);
  }
 }finally{await rm(dir,{force:true,recursive:true});}
});
