import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewMunicipalSeoDraftBatch as review} from '../src/geo-batch-preflight.mjs';

const paragraph=city=>
  'Nesta análise específica de '+city+' consideramos empresas que precisam de páginas claras para apresentar serviços, responder perguntas comerciais e facilitar o contato, com exemplos de estrutura, navegação, acessibilidade e planejamento digital. '+
  'A escolha entre uma Landing Page e um site institucional deve considerar o objetivo da campanha, a quantidade de conteúdos relevantes, a disponibilidade de atendimento e a necessidade de revisões. '+
  'O estudo local precisa ser revisado com informações comprovadas antes de qualquer divulgação.';
const candidate=(overrides={})=>({
  serviceSlug:'landing-pages',ibgeCode:'2304400',city:'Fortaleza',state:'CE',
  availabilityConfirmed:true,
  reasonForLocalPage:'A equipe avalia a intenção de contratação de páginas comerciais para organizações localizadas nesta região e identifica necessidades de conteúdo diferenciadas.',
  localContent:paragraph('Fortaleza'),
  demandEvidence:[{
    source:'editorial_research',
    observedAt:'2026-11-09',
    explanation:'Pesquisa manual documentada, ainda sem volume de busca verificado ou ranking estimado.'
  }],
  ...overrides
});
const existing=value=>({
  serviceSlug:value.serviceSlug,ibgeCode:value.ibgeCode,
  city:value.city,state:value.state,localContent:value.localContent
});
const base=()=>({candidates:[candidate()],existing:[],maxSimilarity:0.75});

test('qualified city draft requires human editorial review, never auto-indexes',()=>{
  const r=review(base());
  assert.equal(r.contractVersion,'seo-municipal-batch-editorial-offline-v1');
  assert.deepEqual(r.summary,{
    suppliedDrafts:1,suppliedExistingPages:0,
    blockedDrafts:0,awaitingHumanReview:1
  });
  assert.equal(r.items[0].reviewStatus,'human_editorial_review_required');
  assert.equal(r.items[0].publishAllowed,false);
  for(const key of ['ibgeMunicipalityCodesVerified',
    'localAvailabilityIndependentlyVerified',
    'searchDemandIndependentlyVerified',
    'completeNationalDuplicationCheckPerformed',
    'automatedPageGeneration','automatedPublication','indexingAllowed',
    'customerDisplayAuthorized','networkPerformed'])
    assert.equal(r[key],false,key);
  assert.equal(r.releaseStatus,'HOLD_HUMAN_EDITORIAL_IBGE_AND_SITE_GATES');
  assert.doesNotMatch(JSON.stringify(r),/Fortaleza|2304400|A equipe avalia|Pesquisa manual documentada/);
});

test('near-identical city-only substitution is blocked in the same batch',()=>{
  const recife=candidate({
    city:'Recife',state:'PE',ibgeCode:'2611606',
    localContent:paragraph('Recife')
  });
  const result=review({candidates:[candidate(),recife],existing:[],maxSimilarity:0.75});
  assert.equal(result.summary.blockedDrafts,1);
  assert.equal(result.items[0].reviewStatus,'human_editorial_review_required');
  assert.equal(result.items[1].reviewStatus,'blocked');
  assert.ok(result.items[1].reasons.includes('possible_templated_or_duplicate_location_content'));
  assert.ok(result.items[1].maximumLocalSimilarity>=0.75);
  assert.equal(result.items[1].publishAllowed,false);
});

test('duplicate city and service is blocked even if draft copy differs',()=>{
  const different=candidate({
    reasonForLocalPage:'Uma proposta editorial diferente com fatos e disponibilidade que ainda precisam ser revisados antes de publicação local.',
    localContent:paragraph('Outra experiência editorial')+
      ' Detalhes locais diferentes, ainda sob revisão humana.'
  });
  const result=review({
    candidates:[different],
    existing:[existing(candidate())],
    maxSimilarity:0.75
  });
  assert.equal(result.summary.blockedDrafts,1);
  assert.ok(result.items[0].reasons.includes('municipality_service_page_already_exists'));
});

test('unsubstantiated service and contact details are not published or echoed',()=>{
  const r=review({
    candidates:[candidate({
      availabilityConfirmed:false,
      demandEvidence:[],
      localContent:paragraph('Fortaleza')+' Contato: pessoal@empresa.example.'
    })],
    existing:[],maxSimilarity:0.75
  });
  for(const reason of [
    'local_service_availability_unconfirmed',
    'search_demand_evidence_missing',
    'possible_personal_data_in_content'
  ])assert.ok(r.items[0].reasons.includes(reason));
  assert.equal(r.summary.blockedDrafts,1);
  assert.doesNotMatch(JSON.stringify(r),/pessoal@empresa\.example/);
});

test('format-valid IBGE code is never reported as externally verified',()=>{
  const r=review({
    candidates:[candidate({ibgeCode:'0000000'})],
    existing:[],maxSimilarity:0.75
  });
  assert.equal(r.summary.awaitingHumanReview,1);
  assert.equal(r.ibgeMunicipalityCodesVerified,false);
  assert.equal(r.items[0].publishAllowed,false);
});

test('rejects oversized workloads, suspicious fields, getters and symbols',()=>{
  const x=base();
  x.candidates=Array.from({length:26},()=>candidate());
  assert.throws(()=>review(x),/invalid bounded editorial input/);
  x.candidates=[candidate()];
  x.existing=Array.from({length:251},()=>existing(candidate()));
  assert.throws(()=>review(x),/invalid bounded editorial input/);
  for(const maxSimilarity of [0,1,-0.1,NaN,'0.75'])
    assert.throws(()=>review({...base(),maxSimilarity}),/invalid bounded editorial input/);

  assert.throws(()=>review({...base(),publishAllowed:true}),/invalid bounded editorial input/);
  assert.throws(()=>review({...base(),candidates:[{
    ...candidate(),token:'PRIVATE_SECRET'
  }]}),/invalid bounded editorial input/);
  const badEvidence=candidate({
    demandEvidence:[{
      source:'editorial_research',observedAt:'2026-11-09',
      explanation:'Legitimate explanation plus SECRET',
      cookie:'secret'
    }]
  });
  assert.throws(()=>review({...base(),candidates:[badEvidence]}),/invalid bounded editorial input/);

  const getter={};
  Object.defineProperty(getter,'candidates',{
    enumerable:true,get(){throw Error('PRIVATE_SECRET');}
  });
  Object.assign(getter,{existing:[],maxSimilarity:0.75});
  assert.throws(()=>review(getter),/invalid bounded editorial input/);
  const withSymbol=base();
  withSymbol[Symbol('permission')]='admin';
  assert.throws(()=>review(withSymbol),/invalid bounded editorial input/);
  const sparse=base();sparse.candidates=new Array(1);
  assert.throws(()=>review(sparse),/invalid bounded editorial input/);
});

test('does not claim global uniqueness for a partial existing inventory',()=>{
  const r=review(base());
  assert.equal(r.completeNationalDuplicationCheckPerformed,false);
  assert.ok(r.limitations.some(x=>x.includes('may be incomplete')));
  assert.equal(r.networkPerformed,false);
});
