import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {planOfflineGscQueryPage} from '../src/gsc-query-page-planner.mjs';

const script=new URL('../scripts/prepare-portal-query-page-display-offline.mjs',import.meta.url);
const run=(...argv)=>spawnSync(process.execPath,[script.pathname,...argv],{
  encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024
});
const base={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:3,startRow:0};
const row=(term,path,clicks)=>({
  keys:[term,'https://example.com/'+path],
  clicks,impressions:100,ctr:clicks/100,position:8
});
const fixture=()=>({
  sourceRevision:'a'.repeat(40),
  plan:planOfflineGscQueryPage(base),
  pages:[{startRow:0,rows:[
    row('PRIVATE-TERM-F80','one',6),
    row('PRIVATE-TERM-F80','two',5)
  ],responseAggregationType:'byPage'}]
});
function temp(callback){
  const dir=mkdtempSync(join(tmpdir(),'seo-f80-'));
  try{callback(dir);}finally{rmSync(dir,{recursive:true,force:true});}
}
function assertSafe(out){
  assert.equal(out.status,0,out.stderr);
  assert.doesNotMatch(out.stdout+out.stderr,
    /PRIVATE-TERM-F80|PERSONAL-F80|https:\/\/example\.com|session=SECRET-F80/);
  const model=JSON.parse(out.stdout);
  assert.equal(model.contractVersion,'seo-portal-query-page-display-offline-v1');
  assert.equal(model.customerDisplayAuthorized,false);
  assert.equal(model.publicationAuthorized,false);
  assert.equal(model.oauthVerified,false);
  assert.equal(model.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  return model;
}

test('F80 CLI emits sanitized internal-only metrics from original evidence',()=>{
  temp(dir=>{
    const path=join(dir,'PERSONAL-F80-EVIDENCE.json');
    writeFileSync(path,JSON.stringify(fixture()));
    const model=assertSafe(run(path));
    assert.equal(model.metricsWithheld,false);
    assert.equal(model.summary.queriesOnMultiplePages,1);
    assert.deepEqual(model.suggestedReviews,['review_query_page_overlap']);
  });
});
test('F80 CLI hides query/overlap metrics after privacy redaction',()=>{
  temp(dir=>{
    const path=join(dir,'PERSONAL-F80.json');
    const input=fixture();input.pages[0].rows[1].keys[0]='123.456.789-09';
    writeFileSync(path,JSON.stringify(input));
    const model=assertSafe(run(path));
    assert.equal(model.coverageStatus,'REDACTED_ROWS_NO_SIGNALS');
    assert.equal(model.metricsWithheldReason,'PRIVACY_REDACTION');
    for(const key of ['analyzedRows','distinctQueries',
      'queriesOnMultiplePages','pagesAcrossOverlappingQueries'])
      assert.equal(model.summary[key],null);
    assert.deepEqual(model.suggestedReviews,[]);
    assert.doesNotMatch(JSON.stringify(model),/123\.456\.789-09/);
  });
});
test('F80 CLI hides query/overlap metrics after possible pagination truncation',()=>{
  temp(dir=>{
    const path=join(dir,'partial.json');
    const input=fixture();
    input.plan=planOfflineGscQueryPage({...base,rowLimit:2});
    writeFileSync(path,JSON.stringify(input));
    const model=assertSafe(run(path));
    assert.equal(model.coverageStatus,'PARTIAL_BATCH_NO_SIGNALS');
    assert.equal(model.summary.receivedRows,2);
    assert.equal(model.summary.distinctQueries,null);
    assert.equal(model.summary.queriesOnMultiplePages,null);
    assert.deepEqual(model.suggestedReviews,[]);
  });
});
test('F80 CLI refuses flags, symlinks, malformed data and forged credentials',()=>{
  temp(dir=>{
    const path=join(dir,'PERSONAL-F80-SECRET.json');
    const link=join(dir,'PERSONAL-F80-link');
    writeFileSync(path,'{"raw":"PERSONAL-F80-SECRET",}');
    symlinkSync(path,link);
    for(const out of [run(path),run(link),run(path,'--publish'),run('--publish'),run()]){
      assert.notEqual(out.status,0);
      assert.doesNotMatch(out.stdout+out.stderr,/PERSONAL-F80|SECRET/);
    }
    const input=fixture();
    input.plan.oauthVerified=true;
    writeFileSync(path,JSON.stringify(input));
    assert.notEqual(run(path).status,0);
    writeFileSync(path,Buffer.from([0xC3,0x28]));
    assert.notEqual(run(path).status,0);
  });
});
test('F80 CLI strictly rejects oversized private input without echoing it',()=>{
  temp(dir=>{
    const path=join(dir,'PERSONAL-F80-OVERSIZE.json');
    writeFileSync(path,'X'.repeat(10*1024*1024+1));
    const result=run(path);
    assert.notEqual(result.status,0);
    assert.doesNotMatch(result.stdout+result.stderr,/PERSONAL-F80|X{16}/);
  });
});
