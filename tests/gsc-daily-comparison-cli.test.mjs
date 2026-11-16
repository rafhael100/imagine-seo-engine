import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const executable=new URL('../scripts/compare-gsc-daily-offline.mjs',import.meta.url);
const run=(file,...rest)=>spawnSync(process.execPath,[executable.pathname,file,...rest],{
  encoding:'utf8',timeout:15000
});
const scope=(startDate,endDate)=>({tenantRef:'imagine-demo',
  propertyFingerprint:'a'.repeat(64),startDate,endDate,rowLimit:92});
const row=(date,clicks,impressions)=>({
  keys:[date],clicks,impressions,ctr:clicks/impressions,position:8
});
const payload=()=>({
  previous:{scope:scope('2026-10-01','2026-10-02'),response:{
    rows:[row('2026-10-01',30,250),row('2026-10-02',30,250)]
  }},
  current:{scope:scope('2026-10-03','2026-10-04'),response:{
    rows:[row('2026-10-03',10,100),row('2026-10-04',10,100)]
  }}
});
test('F55 CLI compares local periods and prints only structured HOLD output',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gsc-compare-f55-'));
  try {
    const file=join(dir,'only-local.json');
    writeFileSync(file,JSON.stringify(payload()));
    const result=run(file);
    assert.equal(result.status,0,result.stderr);
    const parsed=JSON.parse(result.stdout);
    assert.equal(parsed.coverageComplete,true);
    assert.equal(parsed.reviewSignals[0],'review_impression_drop');
    assert.equal(parsed.change.impressionsFraction,-.6);
    assert.equal(parsed.productionReadAuthorized,false);
    assert.equal(parsed.networkPerformed,false);
    assert.doesNotMatch(result.stdout,/only-local\.json|Bearer|secret-/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('F55 CLI rejects symlinks, unknown arguments, fake approval and bad JSON',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gsc-compare-f55-'));
  try {
    const file=join(dir,'PERSON-SECRET-123.json'),link=join(dir,'linked.json');
    writeFileSync(file,'{"secret":"PERSON-SECRET-123",invalid}');
    symlinkSync(file,link);
    for(const item of [run(file),run(link),run(file,'--publish')]){
      assert.notEqual(item.status,0);
      assert.doesNotMatch(item.stderr,/PERSON-SECRET-123|linked\.json/);
    }
    writeFileSync(file,JSON.stringify({...payload(),oauthVerified:true}));
    assert.notEqual(run(file).status,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('F55 CLI redacts partial coverage and never fabricates drop alerts',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gsc-compare-f55-'));
  try{
    const file=join(dir,'partial.json'),partial=payload();
    partial.current.response.rows=[];
    writeFileSync(file,JSON.stringify(partial));
    const result=run(file);
    assert.equal(result.status,0,result.stderr);
    const parsed=JSON.parse(result.stdout);
    assert.equal(parsed.coverageComplete,false);
    assert.deepEqual(parsed.reviewSignals,[]);
  } finally{rmSync(dir,{recursive:true,force:true});}
});
