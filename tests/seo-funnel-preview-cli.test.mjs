import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const cli=new URL('../scripts/preview-seo-funnel-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[cli.pathname,...args],{
  encoding:'utf8',timeout:10000,maxBuffer:1024*1024
});
const snapshot=(date)=>({
  tenantRef:'demo-tenant',expectedProperty:'sc-domain:example.com',
  snapshot:{
    siteUrl:'sc-domain:example.com',startDate:date,endDate:date,
    dimensions:['date'],
    rows:[{keys:[date],clicks:1,impressions:10,ctr:0.1,position:9}],
    rowCount:1,hasMore:false
  }
});
test('F106 CLI returns only safe offline preview with all funnel counts unavailable',async()=>{
  const root=await mkdtemp(join(tmpdir(),'seo-f106-'));
  try{
    const file=join(root,'private-funnel.json');
    await writeFile(file,JSON.stringify({
      comparisonInput:{
        previous:snapshot('2026-10-01'),
        current:snapshot('2026-10-02')
      }
    }));
    const result=run(file);
    assert.equal(result.status,0,result.stderr);
    const report=JSON.parse(result.stdout);
    assert.deepEqual(report.stages.map(s=>s.value),[null,null,null]);
    assert.equal(report.organicSearchDiscovery.clicks,1);
    assert.equal(report.customerDisplayAuthorized,false);
    assert.equal(report.networkPerformed,false);
    assert.doesNotMatch(result.stdout,/example\.com/);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('F106 CLI rejects false privileges and malformed JSON without printing secrets',async()=>{
  const root=await mkdtemp(join(tmpdir(),'seo-f106-'));
  try{
    const file=join(root,'private-funnel.json');
    await writeFile(file,'{"access_token":"PRIVATE_SECRET_654",');
    const invalid=run(file);
    assert.equal(invalid.status,2);
    assert.doesNotMatch(invalid.stderr+invalid.stdout,/PRIVATE_SECRET_654|private-funnel/);
    await writeFile(file,JSON.stringify({
      comparisonInput:{
        previous:snapshot('2026-10-01'),current:snapshot('2026-10-02')
      },
      productionReadAuthorized:true
    }));
    const forged=run(file);
    assert.equal(forged.status,2);
    assert.doesNotMatch(forged.stderr+forged.stdout,/example\.com|private-funnel/);
    assert.equal(run(file,'--unsafe').status,2);
  }finally{await rm(root,{recursive:true,force:true});}
});
