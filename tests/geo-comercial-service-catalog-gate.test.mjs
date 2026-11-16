import test from 'node:test';
import assert from 'node:assert/strict';
import {
 reviewDraftsAgainstCommercialCatalog as review,
 reviewPinnedMunicipalServiceDrafts as pinned
} from '../src/geo-comercial-service-catalog-gate.mjs';
const catalog=[
 {slug:'criacao-de-sites'}, {slug:'landing-pages'}, {slug:'onepage'},
 {slug:'gestao-google-ads'}
];
const paragraph=city=>
 'Nesta análise específica de '+city+' consideramos empresas que precisam de páginas claras para apresentar serviços, responder perguntas comerciais e facilitar o contato, com exemplos de estrutura, navegação, acessibilidade e planejamento digital. '+
 'A escolha entre uma Landing Page e um site institucional deve considerar o objetivo da campanha, a quantidade de conteúdos relevantes, a disponibilidade de atendimento e a necessidade de revisões. '+
 'O estudo local precisa ser revisado com informações comprovadas antes de qualquer divulgação.';
const draft=(overrides={})=>({
 serviceSlug:'landing-pages',ibgeCode:'2304400',city:'Fortaleza',state:'CE',
 availabilityConfirmed:true,
 reasonForLocalPage:'A equipe avalia a intenção de contratação de páginas comerciais para organizações localizadas nesta região e identifica necessidades de conteúdo diferenciadas.',
 localContent:paragraph('Fortaleza'),
 demandEvidence:[{source:'editorial_research',observedAt:'2026-11-09',
  explanation:'Pesquisa manual documentada, sem dados reais de busca ou ranking.'}],
 ...overrides
});
const batch=items=>({candidates:items,existing:[],maxSimilarity:0.75});
test('F180 allows only human planning review for listed initial Landing Pages',()=>{
 const r=review({draftBatchInput:batch([draft()]),services:catalog});
 assert.equal(r.reviewedDrafts,1);
 assert.equal(r.blockedDrafts,0);
 assert.equal(r.reviews[0].status,'human_editorial_review_required');
 assert.equal(r.catalogServices,4);
 for(const field of ['catalogOriginAuthenticatedByModule','localServiceAvailabilityVerified',
  'portalTenantServiceGrantVerified','publicationAuthorized','indexingAuthorized','networkPerformed'])
  assert.equal(r[field],false);
 assert.doesNotMatch(JSON.stringify(r),/Fortaleza|2304400|A equipe avalia/);
});
test('F180 blocks invented service and services outside approved initial scope',()=>{
 for(const [serviceSlug,code] of [
  ['servico-inexistente','service_not_in_pinned_comercial_catalog'],
  ['gestao-google-ads','service_outside_initial_onepage_landing_scope']
 ]){
  const r=review({draftBatchInput:batch([draft({serviceSlug})]),services:catalog});
  assert.equal(r.blockedDrafts,1);
  assert.ok(r.reviews[0].reasons.includes(code));
 }
 const onepage=review({draftBatchInput:batch([draft({serviceSlug:'onepage'})]),services:catalog});
 assert.equal(onepage.blockedDrafts,0);
 assert.equal(onepage.publicationAuthorized,false);
});
test('F180 original F107 editorial block remains enforced',()=>{
 const r=review({draftBatchInput:batch([draft({availabilityConfirmed:false,demandEvidence:[]})]),
  services:catalog});
 assert.equal(r.blockedDrafts,1);
 assert.ok(r.reviews[0].reasons.includes('local_service_availability_unconfirmed'));
 assert.ok(r.reviews[0].reasons.includes('search_demand_evidence_missing'));
});
test('F180 rejects duplicates, missing launch products and accessor-backed slugs',()=>{
 for(const services of [
  [{slug:'landing-pages'},{slug:'landing-pages'},{slug:'onepage'}],
  [{slug:'landing-pages'},{slug:'criacao-de-sites'}],
  [{slug:'landing-pages'},{slug:'onepage'},{}],
  []
 ])assert.throws(()=>review({draftBatchInput:batch([draft()]),services}),/F180/);
 const trick={};
 Object.defineProperty(trick,'slug',{enumerable:true,get(){throw Error('PRIVATE-SECRET')}} );
 assert.throws(()=>review({draftBatchInput:batch([draft()]),services:[
  {slug:'landing-pages'}, {slug:'onepage'},trick]}),/F180/);
});
test('F180 never treats operator-declared same SHA as proof of official source',()=>{
 assert.throws(()=>pinned({
  normalizedDtbCsv:'fake',
  draftBatchInput:batch([draft()]),
  services:catalog
 }),/F179/);
 assert.throws(()=>pinned({
  normalizedDtbCsv:'fake',draftBatchInput:batch([draft()]),
  services:catalog,publicationAuthorized:true
 }),/F180/);
});
