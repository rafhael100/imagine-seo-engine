import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const importer=new URL('../scripts/import-ibge-offline-sha256.mjs',import.meta.url);
const verifier=new URL('../scripts/verify-ibge-offline-sha256.mjs',import.meta.url);
const run=(program,...args)=>spawnSync(process.execPath,[program.pathname,...args],{
  encoding:'utf8',timeout:20000,maxBuffer:1024*1024
});
const sha=s=>createHash('sha256').update(s).digest('hex');
const rows=()=>Array.from({length:5500},(_,i)=>({
  id:2300000+i,nome:'Localidade hipotética '+i,
  'regiao-imediata':{'regiao-intermediaria':{UF:{sigla:'CE'}}},
  microrregiao:null
}));
test('F119 imports and verifies local source with independent operator SHA, no network',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f119-'));
  try{
    const raw=join(dir,'private-source.json');
    const ref=join(dir,'private-reference.json');
    const receipt=join(dir,'private-receipt.json');
    const text=JSON.stringify(rows());
    await writeFile(raw,text);
    const imported=run(importer,raw,sha(text),ref,receipt);
    assert.equal(imported.status,0,imported.stderr);
    const result=JSON.parse(imported.stdout);
    assert.equal(result.normalizedEntries,5500);
    assert.equal(result.officialIbgeTransportVerified,false);
    assert.equal(result.releaseAuthorized,false);
    const checked=run(verifier,raw,ref,receipt);
    assert.equal(checked.status,0,checked.stderr);
    assert.equal(JSON.parse(checked.stdout).publishAllowed,false);
    const info=await stat(ref);
    if(process.platform!=='win32')assert.equal(info.mode&0o077,0);
    const again=run(importer,raw,sha(text),ref,receipt);
    assert.equal(again.status,2,'existing files may never be overwritten');
    const tampered=await readFile(ref,'utf8')+' ';
    await writeFile(ref,tampered);
    const altered=run(verifier,raw,ref,receipt);
    assert.equal(altered.status,2);
    for(const output of [again,altered])
      assert.doesNotMatch(output.stderr+output.stdout,/private-source|private-reference/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('F119 invalid independent checksum leaves no output files',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f119-'));
  try{
    const raw=join(dir,'source-private.json');
    const ref=join(dir,'ref-private.json');
    const receipt=join(dir,'receipt-private.json');
    await writeFile(raw,'{"secret":"PRIVATE_IBGE_SOURCE_2026"}');
    const failed=run(importer,raw,'0'.repeat(64),ref,receipt);
    assert.equal(failed.status,2);
    assert.doesNotMatch(failed.stderr+failed.stdout,
      /PRIVATE_IBGE_SOURCE_2026|source-private|ref-private/);
    await assert.rejects(stat(ref),{code:'ENOENT'});
    await assert.rejects(stat(receipt),{code:'ENOENT'});
  }finally{await rm(dir,{recursive:true,force:true});}
});
