import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const cli=new URL('../scripts/compare-openseo-daily-offline.mjs',import.meta.url);
const run=(...paths)=>spawnSync(process.execPath,[cli.pathname,...paths],{
  encoding:'utf8',timeout:10000,maxBuffer:1024*1024
});
const row=(date)=>({
  keys:[date],clicks:1,impressions:10,ctr:0.1,position:9
});
const make=(startDate,endDate,date)=>({
  tenantRef:'demo-tenant',expectedProperty:'sc-domain:example.com',
  snapshot:{
    siteUrl:'sc-domain:example.com',startDate,endDate,dimensions:['date'],
    rows:[row(date)],rowCount:1,hasMore:false
  }
});

test('F105 CLI compares two local files without leaking source property',async()=>{
  const root=await mkdtemp(join(tmpdir(),'seo-f105-'));
  try{
    const p=join(root,'previous.json'),c=join(root,'current.json');
    await writeFile(p,JSON.stringify(make('2026-10-01','2026-10-01','2026-10-01')));
    await writeFile(c,JSON.stringify(make('2026-10-02','2026-10-02','2026-10-02')));
    const result=run(p,c);
    assert.equal(result.status,0,result.stderr);
    const output=JSON.parse(result.stdout);
    assert.equal(output.submittedDateCoverageComplete,true);
    assert.equal(output.change.clicksPercent,0);
    assert.equal(output.customerDisplayAuthorized,false);
    assert.equal(output.productionReadAuthorized,false);
    assert.doesNotMatch(result.stdout,/example.com/);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('F105 CLI refuses same inode, malformed JSON, surplus args and secrets',async()=>{
  const root=await mkdtemp(join(tmpdir(),'seo-f105-'));
  try{
    const p=join(root,'previous.json'),alias=join(root,'alias.json');
    const c=join(root,'current.json');
    await writeFile(p,JSON.stringify(make('2026-10-01','2026-10-01','2026-10-01')));
    await link(p,alias);
    assert.equal(run(p,p).status,2);
    assert.equal(run(p,alias).status,2);
    assert.equal(run(p).status,2);
    assert.equal(run(p,alias,'--allow').status,2);
    await writeFile(c,'{"token":"TOP_SECRET_LEAK",');
    const result=run(p,c);
    assert.equal(result.status,2);
    assert.doesNotMatch(result.stderr+result.stdout,
      /TOP_SECRET_LEAK|example.com|previous.json|current.json/);
    await writeFile(c,JSON.stringify({...make(
      '2026-10-02','2026-10-02','2026-10-02'),token:'TOP_SECRET_LEAK'}));
    const unexpected=run(p,c);
    assert.equal(unexpected.status,2);
    assert.doesNotMatch(unexpected.stderr+unexpected.stdout,/TOP_SECRET_LEAK/);
  }finally{await rm(root,{recursive:true,force:true});}
});
