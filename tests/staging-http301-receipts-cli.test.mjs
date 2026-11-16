import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL(
  '../scripts/review-staging-http301-receipts-offline.mjs',import.meta.url
));
const input=()=>({
  migrationInput:{
    sourceType:'operator_supplied_legacy_urls_unverified',
    siteDomain:'example.test',canonicalOrigin:'https://example.test/',
    legacyUrls:['http://www.example.test/'],
    targetRoutes:['/'],
    candidates:[{fromUrl:'http://www.example.test/',toPath:'/',status:301}]
  },
  capture:{
    sourceType:'operator_supplied_http_head_captures_unverified',
    observations:[{
      fromUrl:'http://www.example.test/',status:301,
      location:'https://example.test/',finalUrl:'https://example.test/',
      finalStatus:200,redirectHops:1
    }]
  }
});
async function fixture(run){
 const root=await mkdtemp(join(tmpdir(),'seo-f135-'));
 try{
  const path=join(root,'private-staging-headers.json');
  await writeFile(path,JSON.stringify(input()),{mode:0o600});
  await run({root,path});
 }finally{await rm(root,{recursive:true,force:true});}
}
const execute=file=>spawnSync(process.execPath,[script,file],{
  encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024
});
test('F135 reviews 301 receipts, outputs only aggregate review and exit 0',async()=>{
 await fixture(async({path})=>{
  const done=execute(path);
  assert.equal(done.status,0,done.stderr);
  assert.equal(done.stderr,'');
  const report=JSON.parse(done.stdout);
  assert.equal(report.reviewStatus,'human_http_staging_review_required');
  assert.equal(report.summary.matched301ToCanonical,1);
  assert.equal(report.actualHttpCaptureAuthenticated,false);
  assert.equal(report.realDeploymentAuthorized,false);
  for(const secret of ['example.test','private-staging','http://','https://'])
    assert.equal((done.stdout+done.stderr).includes(secret),false,secret);
 });
});
test('F135 exit 2 for unapproved temporary HTTP redirect without raw URL leak',async()=>{
 await fixture(async({path})=>{
  const wrong=input();
  wrong.capture.observations[0].status=302;
  wrong.capture.observations[0].location='https://private.example.test/?token=secret';
  await writeFile(path,JSON.stringify(wrong));
  const done=execute(path);
  assert.equal(done.status,2,done.stderr);
  assert.equal(done.stderr,'');
  const report=JSON.parse(done.stdout);
  assert.equal(report.reviewStatus,'blocked');
  assert.equal(report.summary.wrongRedirectStatusCount,1);
  assert.equal(report.summary.wrongLocationOrFinalUrlCount,1);
  assert.doesNotMatch(done.stdout,/private.example|token=secret/);
 });
});
test('F135 denies symlinks and malformed input without printing filenames',async()=>{
 await fixture(async({root,path})=>{
  const link=join(root,'private-symlink.json');
  await symlink(path,link);
  const badLink=execute(link);
  assert.equal(badLink.status,1);
  assert.equal(badLink.stdout,'');
  assert.equal(badLink.stderr,
    'SEO F135: invalid or unsafe offline HTTP receipt file\n');
  await writeFile(path,'{"token":"PRIVATE');
  const invalid=execute(path);
  assert.equal(invalid.status,1);
  assert.equal(invalid.stdout,'');
  assert.equal(invalid.stderr,
    'SEO F135: invalid or unsafe offline HTTP receipt file\n');
 });
});
