import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script=new URL('../scripts/compare-gsc-overlap-offline.mjs',import.meta.url);
const run=(path,...args)=>spawnSync(process.execPath,[script.pathname,path,...args],{
  encoding:'utf8',timeout:15000
});
const property='sc-domain:example.com';
const base={
  tenantRef:'imagine-demo',siteUrl:property,
  propertyFingerprint:createHash('sha256').update(property).digest('hex'),
  rowLimit:30
};
const row=(q,page,clicks)=>({
  keys:[q,'https://www.example.com/'+page],
  clicks,impressions:100,ctr:clicks/100,position:8
});
const fixture=()=>({
  previous:{
    scope:{...base,startDate:'2026-10-01',endDate:'2026-10-02'},
    response:{rows:[row('service','p1',5)]}
  },
  current:{
    scope:{...base,startDate:'2026-10-03',endDate:'2026-10-04'},
    response:{rows:[
      row('service','p1',5),
      row('service','p2',4),
      row('someone@example.com','private',3)
    ]}
  }
});
test('F66 CLI prints only safe aggregates and no raw provider data',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f66-'));
  try{
    const file=join(dir,'PERSONAL-REPORT.json');
    writeFileSync(file,JSON.stringify(fixture()));
    const out=run(file);
    assert.equal(out.status,0,out.stderr);
    const result=JSON.parse(out.stdout);
    assert.equal(result.previous.queriesOnMultiplePages,0);
    assert.equal(result.current.queriesOnMultiplePages,1);
    assert.equal(result.current.redactedRows,1);
    assert.equal(result.reviewSignals.length,0);
    assert.equal(result.networkPerformed,false);
    assert.equal(result.productionReadAuthorized,false);
    assert.doesNotMatch(out.stdout,
      /service|someone@example\.com|https:\/\/www\.example\.com|PERSONAL-REPORT/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F66 CLI rejects path leaks, symlinks, forged flags and invalid JSON',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f66-'));
  try{
    const file=join(dir,'PERSONAL-SECRET-150.json');
    const link=join(dir,'link.json');
    writeFileSync(file,'{"token":"PERSONAL-SECRET-150",}');
    symlinkSync(file,link);
    for(const value of [run(file),run(link),run(file,'--publish')]){
      assert.notEqual(value.status,0);
      assert.doesNotMatch(value.stdout+value.stderr,
        /PERSONAL-SECRET-150|link\.json/);
    }
    writeFileSync(file,JSON.stringify({...fixture(),oauthVerified:true}));
    assert.notEqual(run(file).status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F66 CLI suppresses trends when one raw period is incomplete',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f66-'));
  try{
    const file=join(dir,'partial.json'),data=fixture();
    data.current.scope.rowLimit=data.current.response.rows.length;
    writeFileSync(file,JSON.stringify(data));
    const out=run(file);
    assert.equal(out.status,0,out.stderr);
    const result=JSON.parse(out.stdout);
    assert.equal(result.coverageComplete,false);
    assert.equal(result.overlapShareChange,null);
    assert.deepEqual(result.reviewSignals,[]);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
