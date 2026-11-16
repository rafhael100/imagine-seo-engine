import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../scripts/review-legacy-migration-build-offline.mjs',import.meta.url));
const origin='https://example.test/';
const plan={
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',canonicalOrigin:origin,
  legacyUrls:['http://www.example.test/','https://www.example.test/en-us/'],
  targetRoutes:['/','/en/'],
  candidates:[
    {fromUrl:'http://www.example.test/',toPath:'/',status:301},
    {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
};
function html(path,lang,body,extra=''){
 const url=new URL(path,origin).href;
 return '<!doctype html><html lang="'+lang+'"><head>'+
  '<meta charset="utf-8"><title>Localized company content '+path+'</title>'+
  '<meta name="description" content="Original service content '+lang+' at '+path+'">'+
  '<meta name="robots" content="index,follow">'+
  '<meta property="og:url" content="'+url+'">'+
  '<link rel="canonical" href="'+url+'">'+extra+
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
  '</head><body><h1>Localized service</h1>'+body+'</body></html>';
}
async function fixture(run){
 const root=await mkdtemp(join(tmpdir(),'seo-f129-cli-'));
 try{
  const build=join(root,'dist');
  await mkdir(join(build,'en'),{recursive:true});
  await writeFile(join(build,'index.html'),
    html('/','pt-BR','<a href="/en/">English</a>'));
  await writeFile(join(build,'en','index.html'),html('/en/','en','Original EN content'));
  await writeFile(join(build,'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
  await writeFile(join(build,'sitemap.xml'),'<urlset>'+
    ['/', '/en/'].map(path=>'<url><loc>'+new URL(path,origin).href+'</loc></url>')
    .join('')+'</urlset>');
  const manifest=join(root,'private-legacy-urls.json');
  await writeFile(manifest,JSON.stringify(plan),{mode:0o600});
  await run({root,build,manifest});
 }finally{await rm(root,{recursive:true,force:true});}
}
function run(manifest,build){
 return spawnSync(process.execPath,[script,manifest,build],{
   encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024
 });
}
test('F129 validates the actual staging build but never authorizes deployment',async()=>{
 await fixture(async({manifest,build})=>{
  const result=run(manifest,build);
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stderr,'');
  const parsed=JSON.parse(result.stdout);
  assert.equal(parsed.reviewStatus,'human_independent_redirect_review_required');
  assert.equal(parsed.summary.auditedRealBuildPages,2);
  assert.equal(parsed.summary.missingTargetRoutes,0);
  assert.equal(parsed.redirectDeploymentAuthorized,false);
  assert.equal(parsed.productionRedirectsApplied,0);
  assert.doesNotMatch(result.stdout,/example\.test|www\.|en-us|private-legacy/);
 });
});
test('F129 responds 2 when a target HTML page is removed',async()=>{
 await fixture(async({manifest,build})=>{
  const original=await readFile(join(build,'sitemap.xml'),'utf8');
  await writeFile(join(build,'sitemap.xml'),
    original.replace(/<url><loc>https:\/\/example\.test\/en\/<\/loc><\/url>/,''));
  const result=run(manifest,build);
  assert.equal(result.status,2,result.stderr);
  assert.equal(JSON.parse(result.stdout).summary.pagesNotInSitemap,1);
 });
});
test('F129 rejects manifest symlink and malformed JSON without leaking path',async()=>{
 await fixture(async({root,manifest,build})=>{
  const link=join(root,'linked.json');
  await symlink(manifest,link);
  const viaLink=run(link,build);
  assert.equal(viaLink.status,1);
  assert.equal(viaLink.stdout,'');
  assert.equal(viaLink.stderr,
    'SEO F129: invalid or unsafe offline migration review\n');
  await writeFile(manifest,'{"secret":');
  const invalid=run(manifest,build);
  assert.equal(invalid.status,1);
  assert.equal(invalid.stdout,'');
  assert.doesNotMatch(invalid.stderr,/secret|example\.test|linked\.json/);
 });
});
