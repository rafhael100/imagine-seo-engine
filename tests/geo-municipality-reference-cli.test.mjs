import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/reconcile-geo-reference-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[script.pathname,...args],{
  encoding:'utf8',timeout:20000,maxBuffer:1024*1024
});
test('reference reconciliation CLI blocks wrong UF without private data',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f110-'));
  try{
    const files=[
      join(dir,'private-drafts.json'),
      join(dir,'private-inventory.json'),
      join(dir,'private-municipalities.json')
    ];
    const text='O planejamento de conteúdo comercial para a região precisa entender a disponibilidade real de serviços, informações úteis para o usuário, atendimento, acessibilidade e originalidade do material editorial. '.repeat(3);
    await writeFile(files[0],JSON.stringify({
      candidates:[{
        serviceSlug:'landing-pages',ibgeCode:'2304400',
        city:'Fortaleza',state:'PE',availabilityConfirmed:true,
        reasonForLocalPage:'Uma revisão de serviços digitais por município deve começar verificando atendimento local e necessidades reais antes de qualquer publicação.',
        localContent:text,
        demandEvidence:[{
          source:'editorial_research',observedAt:'2026-11-09',
          explanation:'Relato documental editorial, sem dados verificados de volume de busca.'
        }]
      }],existing:[],maxSimilarity:0.75
    }));
    await writeFile(files[1],JSON.stringify({
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'site-onepage',ibgeCode:'2611606',state:'PE',
        locale:'pt-BR',canonicalPath:'/sites/site-onepage/recife-pe/',
        contentSha256:createHash('sha256').update('unrelated').digest('hex')
      }]
    }));
    await writeFile(files[2],JSON.stringify({
      sourceType:'operator_supplied_municipality_reference_unverified',
      entries:[
        {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
        {ibgeCode:'2611606',state:'PE',city:'Recife'}
      ]
    }));
    const p=run(...files);
    assert.equal(p.status,0,p.stderr);
    const result=JSON.parse(p.stdout);
    assert.equal(result.summary.blockedDrafts,1);
    assert.ok(result.reviews[0].reasons.includes(
      'candidate_uf_code_prefix_mismatch'));
    for(const sensitive of [
      '2304400','2611606','Fortaleza','Recife',
      'recife-pe','/sites/site-onepage'
    ])assert.ok(!p.stdout.includes(sensitive),sensitive);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('CLI keeps errors generic and rejects extra flags',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f110-'));
  try{
    const files=['private-a.json','private-b.json','private-c.json']
      .map(x=>join(dir,x));
    await Promise.all(files.map((f,i)=>writeFile(f,
      i===2?'{"PRIVATE_MUNICIPALITY_SECRET":':'{}')));
    for(const args of [files,[...files,'--force-publication']]){
      const p=run(...args);
      assert.equal(p.status,2);
      assert.doesNotMatch(p.stdout+p.stderr,
        /PRIVATE_MUNICIPALITY_SECRET|private-a|private-b|private-c/);
    }
  }finally{await rm(dir,{recursive:true,force:true});}
});
