import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {planGscQuery} from '../src/gsc-readonly.mjs';

const script=new URL('../scripts/review-gsc-workflow-offline.mjs',import.meta.url);
const run=(path,...rest)=>spawnSync(process.execPath,[script.pathname,path,...rest],{
  encoding:'utf8',timeout:15000
});
const row=(q)=>({keys:[q],clicks:2,impressions:20,ctr:.1,position:8});
const payload=()=>({
  tenantRef:'imagine-demo',
  requestedProperty:'sc-domain:example.com',
  listedProperties:[{siteUrl:'sc-domain:example.com',permissionLevel:'siteOwner'}],
  plan:planGscQuery({tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
    startDate:'2026-10-01',endDate:'2026-10-07',authorizationConfirmed:true,rowLimit:10}),
  pages:[{startRow:0,rows:[row('private.person@example.com'),row('seo de empresas')]}]
});
test('F51 CLI reads a local fixture and prints only HOLD aggregates',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-gsc-f51-'));
  try{
    const path=join(dir,'fixture.json');
    writeFileSync(path,JSON.stringify(payload()));
    const done=run(path);
    assert.equal(done.status,0,done.stderr);
    const result=JSON.parse(done.stdout);
    assert.equal(result.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
    assert.equal(result.summary.redactedRows,1);
    assert.equal(result.customerDisplayAuthorized,false);
    assert.doesNotMatch(done.stdout,/private.person@example.com|seo de empresas|example.com/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F51 CLI fails closed on invalid JSON, unsafe symlink and extra arguments',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-gsc-f51-'));
  try{
    const file=join(dir,'source.json'),link=join(dir,'linked.json');
    writeFileSync(file,'{"secret": "PERSONAL-SECRET", INVALID}');
    symlinkSync(file,link);
    for(const done of [run(file),run(link),run(file,'extra')]){
      assert.notEqual(done.status,0);
      assert.doesNotMatch(done.stderr,/PERSONAL-SECRET|source.json|linked.json/);
    }
  }finally{rmSync(dir,{recursive:true,force:true});}
});
