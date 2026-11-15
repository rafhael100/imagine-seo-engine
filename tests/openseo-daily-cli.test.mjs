import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const cli=new URL('../scripts/review-openseo-daily-offline.mjs',import.meta.url);
function run(path,...extra){
  return spawnSync(process.execPath,[cli.pathname,path,...extra],{
    encoding:'utf8',timeout:10000,maxBuffer:1024*1024
  });
}
const valid={
  tenantRef:'imagine-demo',
  expectedProperty:'sc-domain:imaginecomunicacao.com.br',
  snapshot:{
    siteUrl:'sc-domain:imaginecomunicacao.com.br',
    startDate:'2026-10-15',endDate:'2026-10-16',
    dimensions:['date'],
    rows:[{keys:['2026-10-15'],clicks:1,impressions:10,ctr:0.1,position:8}],
    rowCount:1,hasMore:false
  }
};
test('F104 CLI accepts private date-only snapshot and never leaks property URL',async()=>{
  const root=await mkdtemp(join(tmpdir(),'imagine-seo-f104-'));
  try{
    const file=join(root,'private-daily-snapshot.json');
    await writeFile(file,JSON.stringify(valid));
    const result=run(file);
    assert.equal(result.status,0,result.stderr);
    const data=JSON.parse(result.stdout);
    assert.equal(data.summary.clicks,1);
    assert.equal(data.period.unreturnedDays,1);
    assert.equal(data.customerDisplayAuthorized,false);
    assert.equal(data.networkPerformed,false);
    assert.doesNotMatch(result.stdout,/imaginecomunicacao\.com\.br/);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('F104 CLI refuses credentials, malformed JSON and extra arguments without echoing source',async()=>{
  const root=await mkdtemp(join(tmpdir(),'imagine-seo-f104-'));
  try{
    const file=join(root,'private.json');
    await writeFile(file,JSON.stringify({...valid,secret:'LEAK_THIS_SECRET'}));
    const result=run(file);
    assert.equal(result.status,2);
    assert.doesNotMatch(result.stderr+result.stdout,/LEAK_THIS_SECRET|imaginecomunicacao\.com\.br/);
    await writeFile(file,'{"token":"LEAK_THIS_SECRET","missing": ');
    const malformed=run(file);
    assert.equal(malformed.status,2);
    assert.doesNotMatch(malformed.stderr,/LEAK_THIS_SECRET/);
    assert.equal(run(file,'--unsafe').status,2);
  }finally{await rm(root,{recursive:true,force:true});}
});
