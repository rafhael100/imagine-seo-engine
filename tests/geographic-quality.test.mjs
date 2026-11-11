import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGeoCandidate,similarityForGeoPages} from '../src/geographic-quality.mjs';

const paragraph = city =>
  'Nesta análise específica de '+city+' consideramos empresas que precisam de páginas claras para apresentar serviços, responder perguntas comerciais e facilitar o contato, com exemplos de estrutura, navegação, acessibilidade e planejamento digital. '+
  'A escolha entre uma Landing Page e um site institucional deve considerar o objetivo da campanha, a quantidade de conteúdos relevantes, a disponibilidade de atendimento e a necessidade de revisões. '+
  'O estudo local precisa ser revisado com informações comprovadas antes de qualquer divulgação.';
const make=(overrides={})=>({
  serviceSlug:'landing-pages',ibgeCode:'2304400',city:'Fortaleza',state:'CE',
  availabilityConfirmed:true,
  reasonForLocalPage:'A equipe avalia a intenção de contratação de páginas comerciais para organizações localizadas nesta região e identifica necessidades de conteúdo diferenciadas.',
  localContent:paragraph('Fortaleza'),
  demandEvidence:[{
    source:'editorial_research',observedAt:'2026-11-09',
    explanation:'Pesquisa manual documentada, ainda sem volume de busca verificado ou ranking estimado.'
  }],
  ...overrides
});
test('qualified draft can be sent to an editor but cannot auto-publish or auto-index',()=>{
  const r=evaluateGeoCandidate(make());
  assert.equal(r.status,'human_editorial_review_required');
  assert.equal(r.publishAllowed,false);
  assert.equal(r.indexingAllowed,false);
  assert.deepEqual(r.reasons,[]);
});
test('blocks generic/unsubstantiated and unserved city pages',()=>{
  const r=evaluateGeoCandidate(make({
    availabilityConfirmed:false,reasonForLocalPage:'SEO',localContent:'Criação de Landing Pages',
    demandEvidence:[]
  }));
  for(const code of ['local_service_availability_unconfirmed','local_page_rationale_insufficient',
    'local_content_insufficient','search_demand_evidence_missing']){
    assert.ok(r.reasons.includes(code));
  }
  assert.equal(r.status,'blocked');
});
test('detects city-name-only substitutions as high similarity templates',()=>{
  const prev=make();
  const next=make({city:'Recife',state:'PE',ibgeCode:'2611606',localContent:paragraph('Recife')});
  assert.ok(similarityForGeoPages(next,prev)>=0.75);
  const r=evaluateGeoCandidate(next,[prev]);
  assert.ok(r.reasons.includes('possible_templated_or_duplicate_location_content'));
  assert.equal(r.publishAllowed,false);
});
test('blocks duplicate municipality/service without needing identical copy',()=>{
  const r=evaluateGeoCandidate(make(),[make({localContent:paragraph('Outro conteúdo contextual')})]);
  assert.ok(r.reasons.includes('municipality_service_page_already_exists'));
});
test('does not pretend to verify official municipality records or ranking',()=>{
  const r=evaluateGeoCandidate(make({ibgeCode:'0000000'}));
  // Format alone does not establish official existence: this must be cross-checked externally.
  assert.equal(r.publishAllowed,false);
  assert.equal(r.methodology,'local_requirements_and_3gram_jaccard_no_search_metrics');
});
test('rejects personal contact details inside draft body',()=>{
  const r=evaluateGeoCandidate(make({localContent:paragraph('Fortaleza')+' Contate fulano@empresa.com.'}));
  assert.ok(r.reasons.includes('possible_personal_data_in_content'));
});
test('requires demand evidence with actual declared source, date and explanation',()=>{
  const r=evaluateGeoCandidate(make({demandEvidence:[{
    source:'fabricated',observedAt:'2026-11-09',explanation:'Foi encontrado volume nacional fictício para a pesquisa.'
  }]}));
  assert.ok(r.reasons.includes('search_demand_evidence_invalid'));
});
test('enforces safe bounds and does not accept invalid thresholds',()=>{
  assert.throws(()=>evaluateGeoCandidate(null),/candidate object/);
  assert.throws(()=>evaluateGeoCandidate(make(),{},{}),/bounded array/);
  assert.throws(()=>evaluateGeoCandidate(make(),[],{maxSimilarity:1.5}),/invalid similarity/);
});
