import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const cli=new URL('../scripts/review-gsc-query-page-offline.mjs',import.meta.url);
const run=(path,...args)=>spawnSync(process.execPath,[cli.pathname,path,...args],{
  encoding:'utf8',timeout:15000
});
const scope={
  tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  propertyFingerprint:createHash('sha256').update('sc-domain:example.com').digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:10
};
const row=(q,p,clicks)=>({
  keys:[q,'https://www.example.com/'+p],clicks,impressions:100,
  ctr:clicks/100,position:7
});
const fixture=()=>({scope,response:{rows:[
  row('landing pages','a',4),
  row('landing pages','b',3),
  row('person@example.com','private',1)
]}});
test('F58 CLI returns only aggregate overlap counts and HOLD flags',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f58-'));
  try {
    const file=join(dir,'private.json');
    writeFileSync(file,JSON.stringify(fixture()));
    const out=run(file);
    assert.equal(out.status,0,out.stderr);
    const result=JSON.parse(out.stdout);
    assert.equal(result.summary.receivedRows,3);
    assert.equal(result.summary.redactedRows,1);
    assert.equal(result.summary.queriesOnMultiplePages,1);
    assert.equal(result.customerDisplayAuthorized,false);
    assert.equal(result.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
    assert.doesNotMatch(out.stdout,/landing pages|person@example\.com|https:\/\/www\.example\.com|\/private/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('F58 CLI refuses unsafe files, forged permissions and extra arguments',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f58-'));
  try {
    const file=join(dir,'PERSONAL-SECRET-file.json');
    const link=join(dir,'link.json');
    writeFileSync(file,'{"PERSONAL-SECRET-data": invalid}');
    symlinkSync(file,link);
    for(const output of [run(file),run(link),run(file,'--send')]){
      assert.notEqual(output.status,0);
      assert.doesNotMatch(output.stdout+output.stderr,/PERSONAL-SECRET|link\.json/);
    }
    writeFileSync(file,JSON.stringify({...fixture(),productionReadAuthorized:true}));
    assert.notEqual(run(file).status,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('F58 CLI handles empty arrays without fabricating query/page overlap',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f58-'));
  try {
    const file=join(dir,'empty.json');
    writeFileSync(file,JSON.stringify({scope,response:{rows:[]}}));
    const output=run(file);
    assert.equal(output.status,0,output.stderr);
    assert.equal(JSON.parse(output.stdout).summary.queriesOnMultiplePages,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
