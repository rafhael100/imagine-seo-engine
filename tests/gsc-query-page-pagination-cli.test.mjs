import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script=new URL('../scripts/review-gsc-query-page-pages-offline.mjs',import.meta.url);
const run=(file,...args)=>spawnSync(process.execPath,[script.pathname,file,...args],{
  encoding:'utf8',timeout:15000
});
const property='sc-domain:example.com';
const scope={tenantRef:'imagine-demo',siteUrl:property,
  propertyFingerprint:createHash('sha256').update(property).digest('hex'),
  startDate:'2026-10-01',endDate:'2026-10-07',rowLimit:2};
const row=(q,p,c)=>({
  keys:[q,'https://example.com/'+p],
  clicks:c,impressions:100,ctr:c/100,position:8
});
const fixture=()=>({scope,pages:[
  {startRow:0,rows:[row('landing pages','a',5),row('site','b',4)]},
  {startRow:2,rows:[row('landing pages','c',3),
    row('person@example.com','private',2)]}
]});
test('F60 CLI reviews multiple pages without revealing queries, pages or names',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f60-'));
  try{
    const path=join(dir,'PRIVATE-CASE.json');
    writeFileSync(path,JSON.stringify(fixture()));
    const output=run(path);
    assert.equal(output.status,0,output.stderr);
    const result=JSON.parse(output.stdout);
    assert.equal(result.summary.receivedRows,4);
    assert.equal(result.summary.redactedRows,1);
    assert.equal(result.summary.queriesOnMultiplePages,1);
    assert.equal(result.pagination.nextStartRow,4);
    assert.equal(result.pagination.mayHaveMore,true);
    assert.equal(result.releaseStatus,'HOLD_EXTERNAL_BACKEND_VERIFICATION');
    assert.doesNotMatch(output.stdout,/landing pages|person@example.com|PRIVATE-CASE|https:\/\/example\.com/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F60 CLI rejects forged authorization, broken page offsets and unsafe files',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f60-'));
  try{
    const path=join(dir,'SECRET-INPUT.json'),link=join(dir,'symlink.json');
    writeFileSync(path,'{"token":"SECRET-INPUT","bad":}');
    symlinkSync(path,link);
    for(const bad of [run(path),run(link),run(path,'--publish')]){
      assert.notEqual(bad.status,0);
      assert.doesNotMatch(bad.stderr,/SECRET-INPUT|symlink.json/);
    }
    writeFileSync(path,JSON.stringify({...fixture(),oauthVerified:true}));
    assert.notEqual(run(path).status,0);
    const payload=fixture();
    payload.pages[1].startRow=4;
    writeFileSync(path,JSON.stringify(payload));
    assert.notEqual(run(path).status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F60 CLI accepts partial page without assuming total provider coverage',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f60-'));
  try{
    const path=join(dir,'sample.json');
    const payload=fixture();
    payload.pages[1].rows.pop();
    writeFileSync(path,JSON.stringify(payload));
    const result=run(path);
    assert.equal(result.status,0,result.stderr);
    const output=JSON.parse(result.stdout);
    assert.equal(output.pagination.mayHaveMore,false);
    assert.equal(output.pagination.nextStartRow,null);
    assert.equal(output.summary.queriesOnMultiplePages,1);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
