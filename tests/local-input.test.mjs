import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readBoundedLocalText} from '../src/local-input.mjs';

async function withFile(fn){
  const dir=await mkdtemp(join(tmpdir(),'seo-safe-read-'));
  try{return await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}
}
test('reads a local regular file as UTF-8 without fetching it',async()=>{
  await withFile(async dir=>{
    const path=join(dir,'report.csv');
    await writeFile(path,'Título;Cliques\nBusca;2\n','utf8');
    assert.equal(await readBoundedLocalText(path),'Título;Cliques\nBusca;2\n');
  });
});
test('refuses symbolic links even when pointing at a valid report',async()=>{
  await withFile(async dir=>{
    const original=join(dir,'source.txt'),alias=join(dir,'alias.txt');
    await writeFile(original,'private query');
    await symlink(original,alias);
    await assert.rejects(readBoundedLocalText(alias),/SEO input:/);
  });
});
test('refuses files larger than the configured maximum',async()=>{
  await withFile(async dir=>{
    const path=join(dir,'large.txt');
    await writeFile(path,'a'.repeat(200));
    await assert.rejects(readBoundedLocalText(path,{maxBytes:100}),/size limit/);
  });
});
test('requires a bounded positive byte maximum',async()=>{
  await withFile(async dir=>{
    const path=join(dir,'small.txt');
    await writeFile(path,'hi');
    await assert.rejects(readBoundedLocalText(path,{maxBytes:0}),/invalid local file/);
    await assert.rejects(readBoundedLocalText(path,{maxBytes:20*1024*1024}),/invalid local file/);
  });
});
