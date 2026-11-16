import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const path=new URL('../scripts/review-geo-batch-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[path.pathname,...args],{
  encoding:'utf8',timeout:15000,maxBuffer:1024*1024
});
const text='Nesta análise específica da região avaliamos empresas com demanda de atendimento, comunicação profissional e páginas comerciais cuidadosamente construídas para explicar serviços. '+
  'As decisões sobre arquitetura, navegação, acessibilidade e conversão devem refletir características concretas do negócio e não a simples troca do nome da cidade. '+
  'A revisão editorial deve confirmar o atendimento local e as fontes antes de disponibilizar páginas ao público.';
const candidate=()=>({
  serviceSlug:'landing-pages',ibgeCode:'2304400',city:'Fortaleza',
  state:'CE',availabilityConfirmed:true,
  reasonForLocalPage:'A equipe avalia a procura local por páginas comerciais, mas exige verificação independente da intenção de busca e dos serviços disponíveis nesta região.',
  localContent:text+' Contato fictício: PRIVADO_IMPORTANTE@empresa.example.',
  demandEvidence:[{
    source:'editorial_research',observedAt:'2026-11-09',
    explanation:'Nota de pesquisa local sem confirmação de volume ou posição.'
  }]
});
test('CLI emits no draft text, identity or municipality even for blocked page',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f107-'));
  try{
    const file=join(dir,'private-drafts.json');
    await writeFile(file,JSON.stringify({
      candidates:[candidate()],existing:[],maxSimilarity:0.75
    }));
    const r=run(file);
    assert.equal(r.status,0,r.stderr);
    const result=JSON.parse(r.stdout);
    assert.equal(result.summary.blockedDrafts,1);
    assert.ok(result.items[0].reasons.includes('possible_personal_data_in_content'));
    assert.equal(result.automatedPublication,false);
    assert.equal(result.indexingAllowed,false);
    assert.doesNotMatch(r.stdout,/PRIVADO_IMPORTANTE|Fortaleza|2304400|empresa\.example/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('CLI rejects malformed file and extra arguments without leaking content',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f107-'));
  try{
    const file=join(dir,'private-drafts.json');
    await writeFile(file,'{"access_token":"VERY_PRIVATE_SECRET_2026",');
    const r=run(file);
    assert.equal(r.status,2);
    assert.doesNotMatch(r.stderr+r.stdout,/VERY_PRIVATE_SECRET_2026|private-drafts/);
    const extra=run(file,'--debug');
    assert.equal(extra.status,2);
    assert.doesNotMatch(extra.stderr+extra.stdout,/VERY_PRIVATE_SECRET_2026|private-drafts/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
