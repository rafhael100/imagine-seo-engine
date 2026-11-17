import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL(
 '../scripts/review-ibge-receipt-national-offline.mjs',import.meta.url
));
const run=(a,b)=>spawnSync(process.execPath,[script,a,b],{
 encoding:'utf8',timeout:10000,maxBuffer:1024*1024
});
test('F154 CLI rejects symlink, forged JSON and never leaks raw private content',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f154-'));
 try{
  const source=join(dir,'source-private.json');
  const receipt=join(dir,'receipt-private.json');
  const alias=join(dir,'alias.json');
  await writeFile(source,'{"secret":"MUNICIPIO PRIVADO"}');
  await writeFile(receipt,'{"secret":"RECEIPT PRIVADO"}');
  await symlink(source,alias);
  for(const a of [source,alias]){
   const result=run(a,receipt);
   assert.equal(result.status,1);
   assert.equal(result.stdout,'');
   assert.equal(result.stderr,
     'SEO F154: private IBGE proof or national coverage rejected\n');
   assert.doesNotMatch(result.stderr,/MUNICIPIO PRIVADO|RECEIPT PRIVADO/);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
