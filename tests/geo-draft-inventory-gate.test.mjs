import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {screenMunicipalDraftsAgainstInventory as screen} from '../src/geo-draft-inventory-gate.mjs';

const hash=text=>createHash('sha256').update(text).digest('hex');
const paragraph=city=>
  'Esta análise de '+city+' examina como empresas locais podem estruturar informações claras sobre serviços digitais, respostas comerciais e jornadas de atendimento, com orientação de conteúdo, acessibilidade, páginas responsivas e experiência de navegação. '+
  'A escolha de uma Landing Page deve se basear nos objetivos comerciais, na disponibilidade real de atendimento e nos dados de pesquisa que a empresa tenha documentado. '+
  'Toda afirmação regional requer verificação editorial antes de publicação.';
const draft=(change={})=>({
  serviceSlug:'landing-pages',ibgeCode:'2304400',city:'Fortaleza',state:'CE',
  availabilityConfirmed:true,
  reasonForLocalPage:'A equipe identificou necessidades locais de comunicação digital que precisam de revisão comercial e confirmação da disponibilidade do serviço antes de criar páginas.',
  localContent:paragraph('Fortaleza'),
  demandEvidence:[{
    source:'editorial_research',observedAt:'2026-11-09',
    explanation:'Nota de observação editorial, sem medição verificada de demanda ou posição no Google.'
  }],
  ...change
});
const inventoryEntry=(change={})=>({
  serviceSlug:'landing-pages',ibgeCode:'2611606',state:'PE',
  locale:'pt-BR',canonicalPath:'/servicos/landing-pages/recife-pe/',
  contentSha256:hash('independently written editorial page'),
  ...change
});
const input=(drafts=[draft()],entries=[inventoryEntry()])=>({
  draftBatchInput:{candidates:drafts,existing:[],maxSimilarity:0.75},
  inventoryInput:{sourceType:'operator_local_inventory_unverified',entries}
});

test('fresh draft goes to human review only; never publishes or indexes',()=>{
  const r=screen(input());
  assert.equal(r.contractVersion,'seo-municipal-draft-inventory-joined-offline-v1');
  assert.equal(r.summary.reviewedDrafts,1);
  assert.equal(r.summary.inventoryEntries,1);
  assert.equal(r.summary.blockedDrafts,0);
  assert.equal(r.reviews[0].status,'human_editorial_review_required');
  assert.deepEqual(r.reviews[0].reasons,[]);
  for(const flag of [
    'globalInventoryComplete','officialIbgeVerified',
    'localityServiceAvailabilityVerified','demandIndependentlyVerified',
    'contentMatchedToPublishedPages','semanticDoorwayRiskEliminated',
    'indexationAllowed','automatedPublication','customerDisplayAuthorized',
    'networkPerformed'
  ])assert.equal(r[flag],false,flag);
  assert.equal(r.reviews[0].publishingAllowed,false);
});
test('existing service + municipality + PT-BR blocks draft regardless of new URL',()=>{
  const entry=inventoryEntry({
    ibgeCode:'2304400',state:'CE',
    canonicalPath:'/landings/regiao-diferente/',
    contentSha256:hash('unrelated body')
  });
  const r=screen(input([draft()],[entry]));
  assert.equal(r.summary.blockedDrafts,1);
  assert.ok(r.reviews[0].reasons.includes(
    'municipality_service_locale_already_in_inventory'));
  assert.equal(r.reviews[0].publishingAllowed,false);
});
test('identical body hash blocks even for different city and service',()=>{
  const r=screen(input([draft()],[inventoryEntry({
    serviceSlug:'site-onepage',
    contentSha256:hash(paragraph('Fortaleza'))
  })]));
  assert.equal(r.reviews[0].status,'blocked');
  assert.deepEqual(r.reviews[0].reasons,['identical_draft_body_in_inventory']);
});
test('different English locale is not silently treated as PT-BR identity',()=>{
  const r=screen(input([draft()],[inventoryEntry({
    ibgeCode:'2304400',state:'CE',locale:'en-US',
    canonicalPath:'/en/landing-pages/fortaleza/',
    contentSha256:hash('English-language independently written copy')
  })]));
  assert.equal(r.reviews[0].status,'human_editorial_review_required');
  assert.equal(r.localeAssumption,'pt-BR_draft_only');
});
test('inventory with unresolved collisions blocks all draft promotion',()=>{
  const one=inventoryEntry(),two=inventoryEntry({
    canonicalPath:'/servicos/landing-pages/recife-novo/',
    contentSha256:hash('different body two')
  });
  const r=screen(input([draft()],[one,two]));
  assert.equal(r.summary.inventoryConflicts,1);
  assert.equal(r.summary.blockedDrafts,1);
  assert.ok(r.reviews[0].reasons.includes(
    'source_inventory_contains_unresolved_collisions'));
});
test('F107 editorial risks remain blocked and no PII is echoed',()=>{
  const secret='private.person@company.example';
  const r=screen(input([draft({
    availabilityConfirmed:false,
    localContent:paragraph('Fortaleza')+' Contact '+secret
  })]));
  assert.equal(r.summary.blockedDrafts,1);
  for(const code of [
    'local_service_availability_unconfirmed',
    'possible_personal_data_in_content'
  ])assert.ok(r.reviews[0].reasons.includes(code),code);
  const json=JSON.stringify(r);
  for(const sensitive of [secret,'Fortaleza','2304400','2611606',
    '/servicos/landing-pages/recife-pe/'])
    assert.ok(!json.includes(sensitive),sensitive);
});
test('rejects forged summaries, OAuth grant fields and invalid nested originals',()=>{
  assert.throws(()=>screen({}),/SEO F109/);
  assert.throws(()=>screen({...input(),customerDisplayAuthorized:true}),/SEO F109/);
  assert.throws(()=>screen({...input(),draftBatchInput:{status:'approved'}}),
    /invalid bounded editorial input/);
  assert.throws(()=>screen({...input(),inventoryInput:{
    sourceType:'official_ibge_verified',entries:[inventoryEntry()]
  }}),/SEO F108/);
  const evil=input();evil[Symbol('authorize')]=true;
  assert.throws(()=>screen(evil),/SEO F109/);
});
