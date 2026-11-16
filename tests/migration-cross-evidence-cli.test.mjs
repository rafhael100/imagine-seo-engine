import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cli=fileURLToPath(new URL(
 '../scripts/review-migration-cross-evidence-offline.mjs',import.meta.url));
const domain='example.test',origin='https://'+domain+'/';
function html(){
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
 '<title>Genuine Portuguese business page</title>'+
 '<meta name="description" content="Professional original local service details">'+
 '<meta name="robots" content="index,follow">'+
 '<meta property="og:url" content="'+origin+'">'+
 '<link rel="canonical" href="'+origin+'">'+
 '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
 '</head><body><h1>Regional Imagine services</h1>'+
 '<p>Original editorial content for a customer service.</p></body></html>';
}
function input(buildDirectory){
 return {
   gscPageInput:{
     sourceType:'operator_supplied_gsc_pages_unverified',
     property:'sc-domain:example.test',canonicalOrigin:origin,
     startDate:'2026-10-17',endDate:'2026-11-13',dataState:'final',
     dimensions:['page'],
     rows:[{
       keys:['http://www.example.test/'],clicks:1,
       impressions:20,ctr:0.05,position:22
     }],hasMore:false
   },
   migrationInput:{
     sourceType:'operator_supplied_legacy_urls_unverified',
     siteDomain:domain,canonicalOrigin:origin,
     legacyUrls:['http://www.example.test/'],
     targetRoutes:['/'],
     candidates:[{
       fromUrl:'http://www.example.test/',toPath:'/',status:301
     }]
   },
   httpCapture:{
     sourceType:'operator_supplied_http_head_captures_unverified',
     observations:[{
       fromUrl:'http://www.example.test/',
       status:301,location:origin,finalUrl:origin,
       finalStatus:200,redirectHops:1
     }]
   },buildDirectory
 };
}
const run=path=>spawnSync(process.execPath,[cli,path],{
 encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024
});
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),'seo-f137-'));
 try{
  const build=join(dir,'compiled-public');
  await mkdir(build);
  await writeFile(join(build,'index.html'),html());
  await writeFile(join(build,'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
  await writeFile(join(build,'sitemap.xml'),
    '<urlset><url><loc>'+origin+'</loc></url></urlset>');
  const file=join(dir,'private-qa-request.json');
  await writeFile(file,JSON.stringify(input(build)),{mode:0o600});
  await fn({dir,build,file});
 }finally{await rm(dir,{force:true,recursive:true});}
}
test('F137 executes combined gate on real local HTML, still review-only',async()=>{
 await fixture(async({file})=>{
  const p=run(file);
  assert.equal(p.status,0,p.stderr);
  assert.equal(p.stderr,'');
  const out=JSON.parse(p.stdout);
  assert.equal(out.reviewStatus,'human_independent_release_review_required');
  assert.equal(out.summary.checkedHttpReceipts,1);
  assert.equal(out.summary.auditedLocalHtmlPages,1);
  assert.equal(out.realProductionReleaseAuthorized,false);
  assert.equal(out.networkPerformed,false);
  for(const hidden of ['example.test','http://','https://','compiled-public','private-qa'])
   assert.ok(!(p.stdout+p.stderr).includes(hidden),hidden);
 });
});
test('F137 exit 2 when GSC and HTTP disagree on migration coverage',async()=>{
 await fixture(async({file,build})=>{
  const data=input(build);
  data.gscPageInput.rows.push({
   keys:['https://www.example.test/missing/'],clicks:0,impressions:5,
   ctr:0,position:28
  });
  data.httpCapture.observations[0].status=302;
  await writeFile(file,JSON.stringify(data));
  const p=run(file);
  assert.equal(p.status,2,p.stderr);
  const out=JSON.parse(p.stdout);
  assert.equal(out.reviewStatus,'blocked');
  assert.deepEqual(out.blockedComponents,[
   'gsc_historical_migration_coverage','http_redirect_receipt_evidence'
  ]);
  assert.doesNotMatch(p.stdout,/missing\/|example.test/);
 });
});
test('F137 refuses symlinked input and build roots, malformed JSON',async()=>{
 await fixture(async({file,build,dir})=>{
  const alias=join(dir,'symlink.json');
  await symlink(file,alias);
  const badLink=run(alias);
  assert.equal(badLink.status,1);
  assert.equal(badLink.stdout,'');
  assert.equal(badLink.stderr,
   'SEO F137: invalid or unsafe private migration QA input\n');
  const buildAlias=join(dir,'build-alias');
  await symlink(build,buildAlias);
  await writeFile(file,JSON.stringify(input(buildAlias)));
  const badBuild=run(file);
  assert.equal(badBuild.status,1);
  assert.equal(badBuild.stdout,'');
  await writeFile(file,'{"private":"broken');
  const invalid=run(file);
  assert.equal(invalid.status,1);
  assert.equal(invalid.stdout,'');
  assert.equal(invalid.stderr,
   'SEO F137: invalid or unsafe private migration QA input\n');
 });
});
