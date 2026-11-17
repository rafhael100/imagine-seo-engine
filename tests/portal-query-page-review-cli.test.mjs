import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {planOfflineGscQueryPage} from '../src/gsc-query-page-planner.mjs';

const script=new URL('../scripts/prepare-portal-query-page-review-offline.mjs',import.meta.url);
const run=(path,...extra)=>spawnSync(process.execPath,[script.pathname,path,...extra],
  {encoding:'utf8',timeout:15000});
const cfg={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:3,startRow:0};
const row=(q,p,c)=>({
  keys:[q,'https://example.com/'+p],
  clicks:c,impressions:100,ctr:c/100,position:8
});
const fixture=()=>({
  sourceRevision:'a'.repeat(40),
  plan:planOfflineGscQueryPage(cfg),
  pages:[{startRow:0,rows:[
    row('PRIVATE-KEYWORD-F75','p1',6),
    row('PRIVATE-KEYWORD-F75','p2',5)
  ],responseAggregationType:'byPage'}]
});
test('F75 CLI exports only an unverified sanitized review packet',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f75-'));
  try{
    const file=join(dir,'PERSONAL-REPORT-F75.json');
    writeFileSync(file,JSON.stringify(fixture()));
    const out=run(file);
    assert.equal(out.status,0,out.stderr);
    const packet=JSON.parse(out.stdout);
    assert.equal(packet.contractVersion,'seo-portal-query-page-review-offline-v1');
    assert.equal(packet.summary.queriesOnMultiplePages,1);
    assert.deepEqual(packet.suggestedReviews,['review_query_page_overlap']);
    assert.equal(packet.customerDisplayAuthorized,false);
    assert.equal(packet.publicationAuthorized,false);
    assert.doesNotMatch(out.stdout+out.stderr,
      /PRIVATE-KEYWORD-F75|PERSONAL-REPORT-F75|https:\/\/example\.com|p1|p2/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F75 CLI omits suggestions if rows are private or batch potentially incomplete',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f75-'));
  try{
    const file=join(dir,'redacted.json');
    const data=fixture();
    data.pages[0].rows[1].keys[0]='123.456.789-09';
    writeFileSync(file,JSON.stringify(data));
    const out=run(file);
    assert.equal(out.status,0,out.stderr);
    const packet=JSON.parse(out.stdout);
    assert.equal(packet.coverageStatus,'REDACTED_ROWS_NO_SIGNALS');
    assert.deepEqual(packet.suggestedReviews,[]);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('F75 CLI refuses invalid JSON, symlinks, spoofed permissions and extra flags',()=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f75-'));
  try{
    const file=join(dir,'SECRET-PATH-F75.json'),link=join(dir,'secret-link.json');
    writeFileSync(file,'{"secret":"PERSON-SECRET-F75",}');
    symlinkSync(file,link);
    for(const out of [run(file),run(link),run(file,'--publish')]){
      assert.notEqual(out.status,0);
      assert.doesNotMatch(out.stdout+out.stderr,
        /SECRET-PATH-F75|secret-link|PERSON-SECRET-F75/);
    }
    const data=fixture();
    data.plan.oauthVerified=true;
    writeFileSync(file,JSON.stringify(data));
    assert.notEqual(run(file).status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
