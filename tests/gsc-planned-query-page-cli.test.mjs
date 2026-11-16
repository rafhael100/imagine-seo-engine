import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {planOfflineGscQueryPage} from '../src/gsc-query-page-planner.mjs';

const script=new URL('../scripts/review-gsc-planned-query-page-offline.mjs',import.meta.url);
const run=(path,...extras)=>spawnSync(process.execPath,[script.pathname,path,...extras],
  {encoding:'utf8',timeout:15000});
const conf={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:2,startRow:0};
const row=(q,p,c)=>({
  keys:[q,'https://example.com/'+p],
  clicks:c,impressions:100,ctr:c/100,position:8
});
const fixture=()=>({
  plan:planOfflineGscQueryPage(conf),
  pages:[
    {startRow:0,rows:[row('MARKETING-PRIVATE','one',5),
      row('PAGES-PRIVATE','two',4)],responseAggregationType:'byPage'},
    {startRow:2,rows:[row('MARKETING-PRIVATE','three',3)],
      responseAggregationType:'byPage'}
  ]
});
test('F73 CLI produces anonymous aggregates with HOLD flags',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f73-'));
  try{
    const path=join(dir,'PATH-SECRET-F73.json');
    writeFileSync(path,JSON.stringify(fixture()));
    const output=run(path);
    assert.equal(output.status,0,output.stderr);
    const result=JSON.parse(output.stdout);
    assert.equal(result.summary.queriesOnMultiplePages,1);
    assert.equal(result.pagination.rowsReceived,3);
    assert.equal(result.oauthVerified,false);
    assert.equal(result.tenantGrantVerified,false);
    assert.equal(result.customerDisplayAuthorized,false);
    assert.equal(result.releaseStatus,'HOLD_AUTHENTICATED_PORTAL_INTEGRATION');
    assert.doesNotMatch(output.stdout+output.stderr,
      /PATH-SECRET|MARKETING-PRIVATE|PAGES-PRIVATE|https:\/\/example\.com/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F73 CLI rejects malicious extra flags and input without leaking tokens',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f73-'));
  try{
    const file=join(dir,'PRIVATE-TOKEN-F73.json');
    const link=join(dir,'sensitive-link.json');
    writeFileSync(file,'{"token":"PERSONAL-TOKEN-F73",}');
    symlinkSync(file,link);
    for(const output of [run(file),run(link),run(file,'--publish')]){
      assert.notEqual(output.status,0);
      assert.doesNotMatch(output.stdout+output.stderr,
        /PERSONAL-TOKEN-F73|PRIVATE-TOKEN-F73|sensitive-link/);
    }
    const altered=fixture();
    altered.plan.customerDisplayAuthorized=true;
    writeFileSync(file,JSON.stringify(altered));
    assert.notEqual(run(file).status,0);
    const extra=fixture();
    extra.pages[1].startRow=3;
    writeFileSync(file,JSON.stringify(extra));
    assert.notEqual(run(file).status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F73 refuses missing file, with no local path disclosure',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f73-'));
  try{
    const out=run(join(dir,'PATH-PRIVATE-MISSING.json'));
    assert.notEqual(out.status,0);
    assert.doesNotMatch(out.stdout+out.stderr,/PATH-PRIVATE-MISSING/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
