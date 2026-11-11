import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script=new URL('../scripts/report-gsc-daily-offline.mjs',import.meta.url);
const run=(path,...args)=>spawnSync(process.execPath,[script.pathname,path,...args],{
  encoding:'utf8',timeout:15000
});
const fixture=()=>({
  scope:{tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:7},
  response:{rows:[
    {keys:['2026-10-01'],clicks:2,impressions:20,ctr:.1,position:8},
    {keys:['2026-10-03'],clicks:1,impressions:10,ctr:.1,position:9}
  ]}
});
test('F53 CLI produces sanitized date report with explicit missing days',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gsc-daily-cli-'));
  try{
    const p=join(dir,'private-daily.json');
    writeFileSync(p,JSON.stringify(fixture()));
    const result=run(p);
    assert.equal(result.status,0,result.stderr);
    const parsed=JSON.parse(result.stdout);
    assert.equal(parsed.period.unreturnedDays,5);
    assert.equal(parsed.summary.clicks,3);
    assert.equal(parsed.summary.impressions,30);
    assert.equal(parsed.productionReadAuthorized,false);
    assert.equal(parsed.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
    assert.doesNotMatch(result.stdout,/private-daily.json|Bearer /);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F53 CLI rejects extra arguments, symlinks, bad fields and raw query records',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gsc-daily-cli-'));
  try{
    const p=join(dir,'SECRET-private.json'),link=join(dir,'linked.json');
    const bad={...fixture(),oauthVerified:true};
    writeFileSync(p,JSON.stringify(bad));
    symlinkSync(p,link);
    for(const result of [run(p),run(link),run(p,'--authorized')]){
      assert.notEqual(result.status,0);
      assert.doesNotMatch(result.stdout+result.stderr,/SECRET-private.json|linked.json|oauthVerified/);
    }
    bad.oauthVerified=undefined;
    bad.response.rows[0].keys=['private@example.com'];
    writeFileSync(p,JSON.stringify(bad));
    assert.notEqual(run(p).status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
