import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/review-geo-inventory-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[script.pathname,...args],{
  encoding:'utf8',timeout:18000,maxBuffer:1024*1024
});
test('offline CLI outputs only counts and row indices, not private route/hash',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f108-'));
  try{
    const path=join(dir,'private-inventory.json');
    const digest=createHash('sha256').update('Private author content').digest('hex');
    await writeFile(path,JSON.stringify({
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'landing-pages',ibgeCode:'2304400',state:'CE',
        locale:'pt-BR',
        canonicalPath:'/servicos/landing-pages/fortaleza-ce/',
        contentSha256:digest
      },{
        serviceSlug:'landing-pages',ibgeCode:'2611606',state:'PE',
        locale:'pt-BR',
        canonicalPath:'/servicos/landing-pages/fortaleza-ce/',
        contentSha256:digest
      }]
    }));
    const output=run(path);
    assert.equal(output.status,0,output.stderr);
    const data=JSON.parse(output.stdout);
    assert.equal(data.summary.conflictCount,2);
    for(const token of [
      'fortaleza-ce','2304400','2611606','landing-pages',digest
    ])assert.doesNotMatch(output.stdout,new RegExp(token));
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('bad JSON and usage error never leak actual contents or paths',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f108-'));
  try{
    const file=join(dir,'my-super-private-inventory.json');
    await writeFile(file,'{"secret":"PRIVATE_TOKEN_SEO_F108",');
    for(const p of [run(file),run(file,'--debug')]){
      assert.equal(p.status,2);
      assert.doesNotMatch(p.stdout+p.stderr,
        /PRIVATE_TOKEN_SEO_F108|my-super-private-inventory/);
    }
  }finally{await rm(dir,{recursive:true,force:true});}
});
