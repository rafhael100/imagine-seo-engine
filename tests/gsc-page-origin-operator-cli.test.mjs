import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/review-gsc-page-origins-offline.mjs',import.meta.url));
const row=(url,clicks,impressions)=>({
  keys:[url],clicks,impressions,ctr:impressions?clicks/impressions:0,
  position:15.5
});
const input=rows=>({
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',
  canonicalOrigin:'https://example.test/',
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],rows,hasMore:false
});
async function fixture(fn){
  const dir=await mkdtemp(join(tmpdir(),'seo-f132-'));
  try{
    const path=join(dir,'sensitive-google-pages.json');
    await writeFile(path,JSON.stringify(input([
      row('https://example.test/',2,100)
    ])),{mode:0o600});
    await fn({dir,path});
  }finally{await rm(dir,{recursive:true,force:true});}
}
const run=path=>spawnSync(process.execPath,[script,path],{
  encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024
});
test('F132 original clean page export returns review candidate, not deployment',async()=>{
 await fixture(async({path})=>{
   const result=run(path);
   assert.equal(result.status,0,result.stderr);
   assert.equal(result.stderr,'');
   const dto=JSON.parse(result.stdout);
   assert.equal(dto.reviewStatus,'HUMAN_CANONICAL_REVIEW_REQUIRED');
   assert.equal(dto.coverageStatus,'SUPPLIED_ROWS_ONLY');
   assert.equal(dto.summary.originBuckets.canonicalHttps.impressions,100);
   assert.equal(dto.productionCanonicalVerified,false);
   assert.equal(dto.publicationAuthorized,false);
   for(const hidden of ['example.test','sensitive-google-pages','https://','/secret/'])
     assert.equal((result.stdout+result.stderr).includes(hidden),false,hidden);
 });
});
test('F132 returns exit 2 for old www and HTTP signals, no hidden URL',async()=>{
 await fixture(async({path})=>{
   await writeFile(path,JSON.stringify(input([
     row('http://www.example.test/',3,134),
     row('https://www.example.test/',5,1132)
   ])));
   const result=run(path);
   assert.equal(result.status,2,result.stderr);
   const dto=JSON.parse(result.stdout);
   assert.equal(dto.summary.noncanonicalImpressions,1266);
   assert.equal(dto.summary.homeOriginVariants,2);
   assert.deepEqual(dto.reviewSignals,[
    'review_http_legacy_index_signals',
    'review_www_apex_canonical_consistency',
    'review_same_path_across_origins',
    'review_homepage_origin_variants'
   ]);
   assert.doesNotMatch(result.stdout,/example\.test|http:\/\//);
 });
});
test('F132 safely holds private URL variants and incomplete pagination',async()=>{
 await fixture(async({path})=>{
   await writeFile(path,JSON.stringify(input([
     row('https://example.test/?session=superprivate',0,2),
     row('https://example.test/',0,4)
   ])));
   const redacted=run(path);
   assert.equal(redacted.status,2,redacted.stderr);
   assert.equal(JSON.parse(redacted.stdout).summary.originBuckets,null);
   assert.doesNotMatch(redacted.stdout,/superprivate|session/);
   const partial=input([row('https://example.test/',1,7)]);
   partial.hasMore=true;
   await writeFile(path,JSON.stringify(partial));
   const remaining=run(path);
   assert.equal(remaining.status,2);
   assert.equal(JSON.parse(remaining.stdout).coverageStatus,'PAGINATION_REMAINS');
 });
});
test('F132 denies symlinks, invalid JSON and malformed source without leaks',async()=>{
 await fixture(async({path,dir})=>{
   const link=join(dir,'private-link.json');
   await symlink(path,link);
   for(const source of [link]){
     const x=run(source);
     assert.equal(x.status,1);
     assert.equal(x.stdout,'');
     assert.equal(x.stderr,'SEO F132: invalid or unsafe offline GSC page input\n');
   }
   await writeFile(path,'{"accountToken":"private');
   const x=run(path);
   assert.equal(x.status,1);
   assert.equal(x.stdout,'');
   assert.equal(x.stderr,'SEO F132: invalid or unsafe offline GSC page input\n');
 });
});
