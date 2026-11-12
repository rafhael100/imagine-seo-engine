import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const command=fileURLToPath(new URL(
  '../scripts/prepare-portal-original-gsc-handoff-offline.mjs',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,[command,...args],{
  encoding:'utf8',timeout:15000,maxBuffer:1024*1024
});
const row=(q,c,i)=>({keys:[q],clicks:c,impressions:i,ctr:c/i,position:8});
const payload=()=>({
  audit:{summary:{pages:1,errors:1,warnings:0},
    errors:[{type:'wrong_canonical',file:'SECRET-F88-PAGE.html',
      message:'SECRET-F88-PAYLOAD'}],warnings:[]},
  previous:{dimensions:['query'],startDate:'2026-10-01',
    endDate:'2026-10-07',
    rows:[row('SECRET-F88-QUERY landing pages',30,300)]},
  current:{dimensions:['query'],startDate:'2026-10-08',
    endDate:'2026-10-14',
    rows:[row('SECRET-F88-QUERY landing pages',8,180)]},
  scope:{tenantRef:'imagine-demo',propertyFingerprint:'a'.repeat(64),
    sourceRevision:'b'.repeat(40)}
});
const withDir=fn=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-f88-'));
  try{fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}
};
const noLeak=text=>assert.doesNotMatch(text,
  /SECRET-F88|123\.456\.789-09|pessoa@example\.com|X{12}/);

test('F88 CLI emits review-only Portal handoff from supplied original evidence',()=>{
  withDir(dir=>{
    const path=join(dir,'SECRET-F88-evidence.json');
    writeFileSync(path,JSON.stringify(payload()));
    const out=run(path);
    assert.equal(out.status,0,out.stderr);
    noLeak(out.stdout+out.stderr);
    const result=JSON.parse(out.stdout);
    assert.equal(result.coverage.metricsWithheld,false);
    assert.equal(result.handoff.organic.previous.clicks,30);
    assert.equal(result.handoff.customerDisplayAuthorized,false);
  });
});
test('F88 CLI with redacted CPF withholds organic from Portal, without leaking',()=>{
  withDir(dir=>{
    const path=join(dir,'SECRET-F88-PII.json');
    const input=payload();
    input.current.rows.push(row('123.456.789-09',1,100));
    writeFileSync(path,JSON.stringify(input));
    const out=run(path);
    assert.equal(out.status,0,out.stderr);
    noLeak(out.stdout+out.stderr);
    const data=JSON.parse(out.stdout);
    assert.equal(data.coverage.metricsWithheld,true);
    assert.equal(data.brief.organic,null);
    assert.equal(data.handoff.organic,null);
    assert.deepEqual(data.handoff.suggestedReviews.map(x=>x.code),
      ['repair_canonical']);
  });
});
test('F88 CLI rejects symlinks, extra args, malformed JSON and forged metadata',()=>{
  withDir(dir=>{
    const path=join(dir,'SECRET-F88-INPUT.json');
    const link=join(dir,'link');
    writeFileSync(path,JSON.stringify(payload()));
    symlinkSync(path,link);
    const invalid=[run(path,'--publish'),run('--publish'),run(),run(link)];
    writeFileSync(path,'{"raw":"SECRET-F88",}');
    invalid.push(run(path));
    const forged=payload();
    forged.oauthVerified=true;
    writeFileSync(path,JSON.stringify(forged));
    invalid.push(run(path));
    for(const out of invalid){
      assert.notEqual(out.status,0);
      assert.equal(out.stdout,'');
      noLeak(out.stderr);
    }
  });
});
test('F88 CLI refuses oversized and non-UTF8 files without private text',()=>{
  withDir(dir=>{
    const path=join(dir,'SECRET-F88-SOURCE.json');
    writeFileSync(path,Buffer.from([0xc3,0x28]));
    const broken=run(path);
    assert.equal(broken.status,2);
    writeFileSync(path,'X'.repeat(10*1024*1024+1));
    const large=run(path);
    assert.equal(large.status,2);
    noLeak(broken.stderr+large.stderr);
  });
});
