import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const command=fileURLToPath(new URL(
  '../scripts/prepare-gsc-organic-trend-display-offline.mjs',import.meta.url));
const run=(args)=>spawnSync(process.execPath,[command,...args],{
  encoding:'utf8',timeout:20000,maxBuffer:1024*1024
});
const row=(q,clicks,impressions)=>({
  keys:[q],clicks,impressions,ctr:clicks/impressions,position:8
});
const input=()=>({
  previous:{dimensions:['query'],startDate:'2026-10-01',endDate:'2026-10-07',
    rows:[row('PRIVATE-F86-ORGANIC landing pages',30,300)]},
  current:{dimensions:['query'],startDate:'2026-10-08',endDate:'2026-10-14',
    rows:[row('PRIVATE-F86-ORGANIC landing pages',8,200)]}
});
const workspace=fn=>{
  const dir=mkdtempSync(join(tmpdir(),'seo-organic-view-'));
  try{fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}
};
function safe(out){
  assert.equal(out.status,0,out.stderr);
  assert.doesNotMatch(out.stdout+out.stderr,
    /PRIVATE-F86|123\.456\.789-09|CONFIDENTIAL-F86|https:\/\/example\.com/);
  const dto=JSON.parse(out.stdout);
  assert.equal(dto.customerDisplayAuthorized,false);
  assert.equal(dto.networkPerformed,false);
  assert.equal(dto.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  return dto;
}

test('F86 CLI emits aggregated synthetic review for unredacted sources',()=>{
  workspace(dir=>{
    const path=join(dir,'CONFIDENTIAL-F86.json');
    writeFileSync(path,JSON.stringify(input()));
    const data=safe(run([path]));
    assert.equal(data.metricsWithheld,false);
    assert.equal(data.summary.previous.clicks,30);
    assert.equal(data.summary.current.impressions,200);
    assert.ok(data.changes.length>0);
  });
});
test('F86 CLI omits ALL comparisons when private query exists',()=>{
  workspace(dir=>{
    const path=join(dir,'CONFIDENTIAL-F86.json');
    const f=input();f.current.rows.push(row('123.456.789-09',1,100));
    writeFileSync(path,JSON.stringify(f));
    const data=safe(run([path]));
    assert.equal(data.metricsWithheld,true);
    assert.deepEqual(data.changes,[]);
    assert.equal(data.summary.previous,null);
    assert.equal(data.summary.current,null);
    assert.equal(data.summary.flaggedClusters,0);
    assert.equal(data.summary.redactedRows,1);
  });
});
test('F86 CLI denies symlinks, extra flags, malformed JSON and missing files',()=>{
  workspace(dir=>{
    const path=join(dir,'CONFIDENTIAL-F86.json');
    const link=join(dir,'link.json');
    writeFileSync(path,JSON.stringify(input()));
    symlinkSync(path,link);
    const invalid=[
      run([path,'--publish']),
      run(['--publish']),
      run([]),
      run([link]),
      run([join(dir,'CONFIDENTIAL-F86-ABSENT.json')])
    ];
    writeFileSync(path,'{"private":"CONFIDENTIAL-F86",}');
    invalid.push(run([path]));
    for(const out of invalid){
      assert.notEqual(out.status,0);
      assert.equal(out.stdout,'');
      assert.doesNotMatch(out.stderr,
        /CONFIDENTIAL-F86|PRIVATE-F86|123\.456\.789-09/);
    }
  });
});
test('F86 CLI blocks oversized and malformed UTF-8 without printing bytes',()=>{
  workspace(dir=>{
    const path=join(dir,'CONFIDENTIAL-F86.json');
    writeFileSync(path,Buffer.from([0xc3,0x28]));
    const bad=run([path]);
    assert.equal(bad.status,2);
    writeFileSync(path,'X'.repeat(10*1024*1024+1));
    const big=run([path]);
    assert.equal(big.status,2);
    assert.doesNotMatch(bad.stderr+big.stderr,/CONFIDENTIAL-F86|X{12}/);
  });
});
