import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL(
  '../scripts/prepare-portal-gsc-csv-handoff-offline.mjs',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,[script,...args],{
  encoding:'utf8',timeout:15000,maxBuffer:1024*1024
});
const baseHeader='Queries,Clicks,Impressions,CTR,Position\n';
const noLeaks=out=>assert.doesNotMatch(out.stdout+out.stderr,
  /PRIVATE-F95|PRIVATE-SOURCE|pessoa@example.com|123\\.456\\.789-09/);
function withFixture(task){
  const dir=mkdtempSync(join(tmpdir(),'seo-f95-'));
  try{
    const audit={
      summary:{pages:1,errors:1,warnings:0},
      errors:[{type:'wrong_canonical',file:'PRIVATE-F95-page.html',
        message:'PRIVATE-SOURCE canonical URL'}],warnings:[]
    };
    writeFileSync(join(dir,'audit.json'),JSON.stringify(audit));
    writeFileSync(join(dir,'before.csv'),baseHeader+
      '"landing pages profissionais",30,300,10%,8\n');
    writeFileSync(join(dir,'after.csv'),baseHeader+
      '"landing pages profissionais",8,200,4%,8\n');
    const manifest={
      auditFile:'audit.json',
      previous:{file:'before.csv',startDate:'2026-10-01',endDate:'2026-10-07'},
      current:{file:'after.csv',startDate:'2026-10-08',endDate:'2026-10-14'},
      scope:{tenantRef:'imagine-demo',
        propertyFingerprint:'a'.repeat(64),sourceRevision:'b'.repeat(40)}
    };
    const path=join(dir,'PRIVATE-F95-manifest.json');
    writeFileSync(path,JSON.stringify(manifest));
    task({dir,manifest,path});
  }finally{rmSync(dir,{recursive:true,force:true});}
}

test('F95 command builds original-evidence Portal handoff directly from two CSV files',()=>{
  withFixture(({path})=>{
    const out=run(path);
    assert.equal(out.status,0,out.stderr);
    noLeaks(out);
    const report=JSON.parse(out.stdout);
    assert.equal(report.coverage.metricsWithheld,false);
    assert.equal(report.handoff.organic.previous.clicks,30);
    assert.equal(report.handoff.organic.current.clicks,8);
    const actions=report.handoff.suggestedReviews.map(x=>x.code);
    assert.ok(actions.includes('repair_canonical'));
    assert.ok(actions.includes('review_click_drop'));
    assert.equal(report.customerDisplayAuthorized,false);
    assert.equal(report.publicationAuthorized,false);
    assert.equal(report.networkPerformed,false);
    assert.equal(report.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  });
});
test('F95 a personal search query hides all organic data in CSV-to-Portal handoff',()=>{
  withFixture(({dir,path})=>{
    writeFileSync(join(dir,'after.csv'),baseHeader+
      '"landing pages profissionais",8,200,4%,8\n'+
      '"pessoa@example.com",1,100,1%,8\n');
    const out=run(path);
    assert.equal(out.status,0,out.stderr);
    noLeaks(out);
    const report=JSON.parse(out.stdout);
    assert.equal(report.coverage.metricsWithheld,true);
    assert.equal(report.brief.organic,null);
    assert.equal(report.handoff.organic,null);
    assert.deepEqual(report.handoff.suggestedReviews.map(x=>x.code),
      ['repair_canonical']);
  });
});
test('F95 refuses malformed manifest, forged authority and CLI flags without leaks',()=>{
  withFixture(({dir,path,manifest})=>{
    const invalid=[run(),run(path,'--publish')];
    writeFileSync(path,JSON.stringify({...manifest,oauthVerified:true}));
    invalid.push(run(path));
    writeFileSync(path,JSON.stringify({...manifest,
      scope:{...manifest.scope,customerDisplayAuthorized:true}}));
    invalid.push(run(path));
    writeFileSync(path,'{"private":"PRIVATE-F95",}');
    invalid.push(run(path));
    const link=join(dir,'PRIVATE-F95-link');
    symlinkSync(path,link);
    invalid.push(run(link));
    for(const out of invalid){
      assert.equal(out.status,2);
      assert.equal(out.stdout,'');
      noLeaks(out);
    }
  });
});
test('F95 rejects Unicode-duplicate queries before emitting a briefing',()=>{
  withFixture(({dir,path})=>{
    writeFileSync(join(dir,'before.csv'),baseHeader+
      '"SEO",5,100,5%,8\n'+
      '"ｓｅｏ",2,100,2%,8\n');
    const out=run(path);
    assert.equal(out.status,2);
    assert.equal(out.stdout,'');
    noLeaks(out);
  });
});
test('F95 refuses oversized, malformed UTF-8 and symlinked CSV input',()=>{
  withFixture(({dir,path})=>{
    const previous=join(dir,'before.csv');
    const target=join(dir,'PRIVATE-F95-file');
    writeFileSync(target,baseHeader+'site,1,100,1%,8\n');
    rmSync(previous);
    symlinkSync(target,previous);
    let out=run(path);
    assert.equal(out.status,2);
    noLeaks(out);
    rmSync(previous);
    writeFileSync(previous,Buffer.from([0xc3,0x28]));
    out=run(path);
    assert.equal(out.status,2);
    noLeaks(out);
    writeFileSync(previous,'X'.repeat(10*1024*1024+1));
    out=run(path);
    assert.equal(out.status,2);
    noLeaks(out);
  });
});

test('F96 rejects absolute, parent and nested paths from supplied manifests',()=>{
  withFixture(({path,manifest})=>{
    for(const candidate of [
      '../before.csv','nested/before.csv','/etc/passwd','C:\\\\Secrets\\\\gsc.csv',
      'https://example.com/gsc.csv','.env','not-a-csv.txt',' before.csv '
    ]){
      const copy={...manifest,previous:{...manifest.previous,file:candidate}};
      writeFileSync(path,JSON.stringify(copy));
      const out=run(path);
      assert.equal(out.status,2);
      assert.equal(out.stdout,'');
      noLeaks(out);
    }
    for(const candidate of ['../audit.json','nested/audit.json','.env','audit.txt']){
      writeFileSync(path,JSON.stringify({...manifest,auditFile:candidate}));
      const out=run(path);
      assert.equal(out.status,2);
      assert.equal(out.stdout,'');
      noLeaks(out);
    }
  });
});
