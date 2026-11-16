import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const script=fileURLToPath(new URL('../scripts/review-municipal-i18n-offline.mjs',import.meta.url));
const hash=s=>createHash('sha256').update(s).digest('hex');
const input={
  sourceType:'operator_local_inventory_unverified',
  entries:[{
    serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
    locale:'pt-BR',canonicalPath:'/servicos/site-onepage/fortaleza-ce/',
    contentSha256:hash('private editorial content')
  }]
};
async function fixture(run){
  const root=await mkdtemp(join(tmpdir(),'seo-f122-cli-'));
  try{
    const path=join(root,'private-input.json');
    await writeFile(path,JSON.stringify(input),{mode:0o600});
    await run({root,path});
  }finally{await rm(root,{recursive:true,force:true});}
}
const invoke=path=>spawnSync(process.execPath,[script,path],{
  encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024
});
test('CLI reports missing locales with correction exit 2 and privacy-safe output',async()=>{
  await fixture(async({path})=>{
    const result=invoke(path);
    assert.equal(result.status,2,result.stderr);
    assert.equal(result.stderr,'');
    assert.equal(JSON.parse(result.stdout).summary.missingLocaleSlots,2);
    for(const hidden of ['fortaleza-ce','site-onepage','2304400',hash('private editorial content'),path])
      assert.equal((result.stdout+result.stderr).includes(hidden),false,hidden);
  });
});
test('CLI rejects invalid JSON and symlink without showing operator path',async()=>{
  await fixture(async({root,path})=>{
    await writeFile(path,'{"secret":');
    const malformed=invoke(path);
    assert.equal(malformed.status,1);
    assert.equal(malformed.stdout,'');
    assert.equal(malformed.stderr,'SEO F122: invalid or unsafe offline inventory\n');
    await writeFile(path,JSON.stringify(input));
    const link=join(root,'symlink.json');
    await symlink(path,link);
    const viaLink=invoke(link);
    assert.equal(viaLink.status,1);
    assert.equal(viaLink.stdout,'');
    assert.equal(viaLink.stderr,'SEO F122: invalid or unsafe offline inventory\n');
  });
});
