import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL(
 '../scripts/review-ibge-three-source-offline.mjs',import.meta.url
));
const run=paths=>spawnSync(process.execPath,[script,...paths],{
 encoding:'utf8',timeout:12000,maxBuffer:1024*1024
});
test('F157 CLI refuses JSON misuse and symlinks without disclosing private locality names',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f157-'));
 try{
  const ref=join(dir,'f110-private.json'),
   receipt=join(dir,'f117-private.json'),
   dtb=join(dir,'dtb-private.csv'),
   link=join(dir,'link.csv');
  await writeFile(ref,'{"city":"FORTALEZA_PRIVATE"}');
  await writeFile(receipt,'{"source":"SECRET_RECEIPT"}');
  await writeFile(dtb,'ibgeCode;state;city\n5300108;DF;Brasília\n');
  await symlink(dtb,link);
  for(const paths of [[ref,receipt,dtb],[ref,receipt,link]]){
   const result=run(paths);
   assert.equal(result.status,1);
   assert.equal(result.stdout,'');
   assert.equal(result.stderr,
    'SEO F157: official source crosscheck refused private evidence\n');
   assert.doesNotMatch(result.stderr,/FORTALEZA_PRIVATE|SECRET_RECEIPT|Brasília/);
  }
 }finally{await rm(dir,{force:true,recursive:true});}
});
