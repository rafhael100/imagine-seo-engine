import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/import-ibge-localities-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[script.pathname,...args],{
  encoding:'utf8',timeout:18000,maxBuffer:1024*1024
});
const municipality={
  id:2304400,nome:'Fortaleza',
  'regiao-imediata':{
    id:230001,nome:'Região Exemplo',
    'regiao-intermediaria':{
      id:2301,nome:'Região Intermediária Exemplo',
      UF:{id:23,sigla:'CE',nome:'Ceará'}
    }
  }
};
test('converter writes an exclusive private reference and never publishes',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f111-'));
  try{
    const source=join(dir,'private-ibge-input.json');
    const dest=join(dir,'private-reference.json');
    await writeFile(source,JSON.stringify([municipality]));
    const r=run(source,dest);
    assert.equal(r.status,0,r.stderr);
    const status=JSON.parse(r.stdout);
    assert.equal(status.importedRows,1);
    assert.equal(status.ibgeOriginAuthenticated,false);
    assert.equal(status.publicPublicationAuthorized,false);
    const result=JSON.parse(await readFile(dest,'utf8'));
    assert.deepEqual(result.entries,[
      {ibgeCode:'2304400',state:'CE',city:'Fortaleza'}
    ]);
    const info=await stat(dest);
    if(process.platform!=='win32')assert.equal(info.mode&0o077,0);
    const repeated=run(source,dest);
    assert.equal(repeated.status,2,'existing output must never be overwritten');
    assert.doesNotMatch(repeated.stderr+repeated.stdout,
      /private-ibge-input|private-reference/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('malformed export does not create reference or expose token/path',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f111-'));
  try{
    const source=join(dir,'source-private-secret.json');
    const dest=join(dir,'output-private-ref.json');
    await writeFile(source,'{"token":"HIDDEN_SECRET_IBGE_2026",');
    const r=run(source,dest);
    assert.equal(r.status,2);
    assert.doesNotMatch(r.stderr+r.stdout,
      /HIDDEN_SECRET_IBGE_2026|source-private-secret|output-private-ref/);
    await assert.rejects(stat(dest),{code:'ENOENT'});
    const extra=run(source,dest,'--authorize');
    assert.equal(extra.status,2);
  }finally{await rm(dir,{recursive:true,force:true});}
});
