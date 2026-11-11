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

test('F76 refuses malformed UTF-8 bytes instead of silently replacing them',async()=>{
  await withFile(async dir=>{
    for(const [name,bytes] of [
      ['truncated.txt',Buffer.from([0x41,0xc3])],
      ['bad-continuation.txt',Buffer.from([0x41,0xc3,0x28])],
      ['overlong.txt',Buffer.from([0xc0,0xaf])]
    ]){
      const path=join(dir,name);
      await writeFile(path,bytes);
      await assert.rejects(readBoundedLocalText(path),/SEO input: invalid UTF-8/);
    }
  });
});
test('F76 decodes UTF-8 safely even across an internal read boundary',async()=>{
  await withFile(async dir=>{
    const path=join(dir,'unicode-boundary.txt');
    const original='a'.repeat(65535)+'ç'+'fim';
    await writeFile(path,original,'utf8');
    assert.equal(await readBoundedLocalText(path),original);
  });
});
