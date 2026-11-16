import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL(
 '../scripts/review-ibge-national-edition-offline.mjs',import.meta.url
));
const run=path=>spawnSync(process.execPath,[cli,path],{
 encoding:'utf8',timeout:12000,maxBuffer:1024*1024
});
const fake=()=>({
 sourceType:'operator_supplied_municipality_reference_unverified',
 entries:[
  {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
  {ibgeCode:'5300108',state:'DF',city:'Brasília'},
  {ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'}
 ]
});
test('F153 CLI blocks incomplete sample while never printing place names',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seo-f153-'));
 try{
  const file=join(dir,'private-municipalities.json');
  await writeFile(file,JSON.stringify(fake()),{mode:0o600});
  const result=run(file);
  assert.equal(result.status,2,result.stderr);
  assert.equal(result.stderr,'');
  const parsed=JSON.parse(result.stdout);
  assert.equal(parsed.reviewStatus,'blocked');
  assert.equal(parsed.summary.localityDirectoryRows,3);
  assert.equal(parsed.sourceOfficiallyAuthenticated,false);
  assert.equal(parsed.publicationAuthorized,false);
  for(const secret of ['Fortaleza','Brasília','Fernando','2304400',file])
   assert.ok(!result.stdout.includes(secret),secret);
  const link=join(dir,'alias.json');
  await symlink(file,link);
  const unsafe=run(link);
  assert.equal(unsafe.status,1);
  assert.equal(unsafe.stdout,'');
  assert.equal(unsafe.stderr,
   'SEO F153: private reference invalid or edition coverage blocked\n');
 }finally{await rm(dir,{recursive:true,force:true});}
});
