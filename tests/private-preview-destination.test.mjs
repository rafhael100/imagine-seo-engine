import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {requirePrivateEditorialPreviewDestination as safe}
  from '../src/private-preview-destination.mjs';

async function withPrivateRoot(fn){
  const root=await mkdtemp(join(tmpdir(),'seo-f116-'));
  try{await fn(root);}
  finally{await rm(root,{recursive:true,force:true});}
}
test('F116 permits only a brand-new folder beneath trusted non-public parent',async()=>{
  await withPrivateRoot(async root=>{
    const parent=join(root,'private-editorial-review');
    await mkdir(parent);
    const target=join(parent,'fresh-01');
    assert.equal(await safe(target),resolve(target));
    // The caller must still mkdir exclusively and honor 0700/0600.
  });
});
test('F116 refuses common deploy directories no matter how nested',async()=>{
  await withPrivateRoot(async root=>{
    for(const part of ['public','dist','build','out','www','wwwroot','htdocs',
      '_site','.next','.vercel','uploads','static']){
      const base=join(root,part);
      await mkdir(base,{recursive:true});
      await assert.rejects(safe(join(base,'private-drafts')),
        /SEO F116: private nonpublished review directory required/,part);
    }
  });
});
test('F116 refuses private output created anywhere in a Git checkout',async()=>{
  await withPrivateRoot(async root=>{
    const repo=join(root,'repo');
    const nested=join(repo,'content','draft');
    await mkdir(nested,{recursive:true});
    await mkdir(join(repo,'.git'));
    await assert.rejects(safe(join(nested,'new-private-preview')),/SEO F116/);
  });
});
test('F116 refuses symlinked parents even if they resolve outside public tree',async()=>{
  await withPrivateRoot(async root=>{
    const clean=join(root,'clean');
    await mkdir(clean);
    const link=join(root,'shortcut');
    await symlink(clean,link);
    await assert.rejects(safe(join(link,'private-review')),/SEO F116/);
  });
});
test('F116 refuses file parent and absent parent',async()=>{
  await withPrivateRoot(async root=>{
    const file=join(root,'not-a-dir');
    await writeFile(file,'private');
    await assert.rejects(safe(join(file,'private')),/SEO F116/);
    await assert.rejects(safe(join(root,'does-not-exist','private')),/SEO F116/);
  });
});
test('F116 refuses URL-like and malformed paths',async()=>{
  for(const input of ['',null,123,'https://example.com/private',
    '/tmp/private\npreview','/tmp/private\u0000preview']){
    await assert.rejects(safe(input),/SEO F116/);
  }
});
