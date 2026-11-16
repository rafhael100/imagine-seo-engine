import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/screen-geo-drafts-inventory-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[script.pathname,...args],{
  encoding:'utf8',timeout:20000,maxBuffer:1024*1024
});
test('two-file CLI is private and explicitly denies duplicate city-service pages',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f109-'));
  try{
    const drafts=join(dir,'sensitive-drafts.json');
    const inventory=join(dir,'sensitive-inventory.json');
    const body='Análise local do comércio digital e da experiência de usuários que procuram sites, Landing Pages e informações transparentes sobre serviços ofertados. '.repeat(5);
    const hash=createHash('sha256').update('unrelated existing body').digest('hex');
    await writeFile(drafts,JSON.stringify({
      candidates:[{
        serviceSlug:'landing-pages',ibgeCode:'2304400',
        city:'Fortaleza',state:'CE',availabilityConfirmed:true,
        reasonForLocalPage:'Estudo sobre procura por serviços de marketing digital com revisão manual de disponibilidade e propostas locais antes de qualquer publicação.',
        localContent:body,demandEvidence:[{
          source:'editorial_research',observedAt:'2026-11-09',
          explanation:'Pesquisa editorial de exemplo sem demanda Google confirmada.'
        }]
      }],
      existing:[],maxSimilarity:0.75
    }));
    await writeFile(inventory,JSON.stringify({
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'landing-pages',ibgeCode:'2304400',state:'CE',
        locale:'pt-BR',canonicalPath:'/servicos/landing-pages/fortaleza-ce/',
        contentSha256:hash
      }]
    }));
    const p=run(drafts,inventory);
    assert.equal(p.status,0,p.stderr);
    const result=JSON.parse(p.stdout);
    assert.equal(result.summary.blockedDrafts,1);
    assert.ok(result.reviews[0].reasons.includes(
      'municipality_service_locale_already_in_inventory'));
    for(const secret of [
      'Fortaleza','2304400','fortaleza-ce','landing-pages',hash,
      'Análise local'
    ])assert.ok(!p.stdout.includes(secret),secret);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('invalid JSON and extra switches yield only safe diagnostics',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f109-'));
  try{
    const drafts=join(dir,'very-private-drafts.json');
    const inventory=join(dir,'very-private-inventory.json');
    await writeFile(drafts,'{"secret":"PRIVATE_CRM_SECRET_2026",');
    await writeFile(inventory,'{}');
    for(const args of [[drafts,inventory],[drafts,inventory,'--unsafe']]){
      const p=run(...args);
      assert.equal(p.status,2);
      assert.doesNotMatch(p.stdout+p.stderr,
        /PRIVATE_CRM_SECRET_2026|very-private/);
    }
  }finally{await rm(dir,{recursive:true,force:true});}
});
