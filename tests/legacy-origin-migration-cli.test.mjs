import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL(
  '../scripts/review-legacy-origin-migration-offline.mjs',import.meta.url));
const input=candidates=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',
  canonicalOrigin:'https://example.test/',
  legacyUrls:['http://www.example.test/','https://www.example.test/en-us/'],
  targetRoutes:['/','/en/'],
  candidates
});
const complete=[
  {fromUrl:'http://www.example.test/',toPath:'/',status:301},
  {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
];
const invoke=path=>spawnSync(process.execPath,[script,path],{
  encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024
});
async function fixture(fn){
  const folder=await mkdtemp(join(tmpdir(),'seo-f127-cli-'));
  const source=join(folder,'private-legacy-input.json');
  try{
    await writeFile(source,JSON.stringify(input(complete)),{mode:0o600});
    await fn({folder,source});
  }finally{await rm(folder,{recursive:true,force:true});}
}
test('F127 CLI returns 0 for complete plan without publishing any redirects',async()=>{
  await fixture(async({source})=>{
    const out=invoke(source),report=JSON.parse(out.stdout);
    assert.equal(out.status,0,out.stderr);
    assert.equal(out.stderr,'');
    assert.equal(report.reviewStatus,'human_redirect_review_required');
    assert.equal(report.liveRedirectsApplied,0);
    assert.equal(report.redirectsAuthorized,false);
    assert.doesNotMatch(out.stdout,/www\.example|en-us\//);
  });
});
test('F127 CLI returns 2 for missing mappings with private-safe output',async()=>{
  await fixture(async({source})=>{
    await writeFile(source,JSON.stringify(input(complete.slice(0,1))));
    const out=invoke(source);
    assert.equal(out.status,2,out.stderr);
    assert.equal(JSON.parse(out.stdout).summary.unmappedCount,1);
    assert.equal(out.stderr,'');
    assert.doesNotMatch(out.stdout,/example\.test|private-legacy-input/);
  });
});
test('F127 CLI refuses symlinks and malformed JSON without leaking filenames',async()=>{
  await fixture(async({folder,source})=>{
    const link=join(folder,'symlink.json');
    await symlink(source,link);
    for(const out of [invoke(link),await (async()=>{
      await writeFile(source,'{"private":');
      return invoke(source);
    })()]){
      assert.equal(out.status,1);
      assert.equal(out.stdout,'');
      assert.equal(out.stderr,
        'SEO F127: unsafe or invalid local redirect manifest\n');
      assert.doesNotMatch(out.stderr,/private|symlink|example/);
    }
  });
});
