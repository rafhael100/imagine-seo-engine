import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileMunicipalDraftsWithReference as review}
  from '../src/geo-municipality-reference.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
const body=city=>
  'Este estudo editorial para '+city+' examina necessidades regionais de comunicação digital e experiência do cliente. '+
  'Empresas precisam de informações sobre serviços, acessibilidade, navegação e formas de contato alinhadas a seus objetivos comerciais, evitando conteúdo repetitivo. '+
  'A confirmação das necessidades locais e do atendimento pela equipe deve anteceder a publicação das páginas, com verificação de fontes e qualidade do conteúdo.';
const draft=(change={})=>({
  serviceSlug:'landing-pages',ibgeCode:'2304400',state:'CE',city:'Fortaleza',
  availabilityConfirmed:true,
  reasonForLocalPage:'A equipe fará uma avaliação editorial de oportunidades de comunicação para negócios locais com atendimento comprovado e conteúdo próprio, sem promessa de resultado no Google.',
  localContent:body('Fortaleza'),
  demandEvidence:[{
    source:'editorial_research',observedAt:'2026-11-09',
    explanation:'Registro editorial preliminar sem comprovação independente de demanda de busca.'
  }],...change
});
const inventory=(change={})=>({
  serviceSlug:'site-onepage',ibgeCode:'2611606',state:'PE',
  locale:'pt-BR',canonicalPath:'/servicos/site-onepage/recife-pe/',
  contentSha256:hash('different published page body, not verified'),...change
});
const reference=(extra=[])=>({
  sourceType:'operator_supplied_municipality_reference_unverified',
  entries:[
    {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
    {ibgeCode:'2611606',state:'PE',city:'Recife'},
    ...extra
  ]
});
const input=(d=[draft()],inv=[inventory()],ref=reference())=>({
  screenInput:{
    draftBatchInput:{candidates:d,existing:[],maxSimilarity:0.75},
    inventoryInput:{sourceType:'operator_local_inventory_unverified',entries:inv}
  },
  municipalityReference:ref
});
test('matching municipality, UF prefix and name proceeds only to editorial review',()=>{
  const r=review(input());
  assert.equal(r.contractVersion,'seo-ibge-municipality-reference-review-offline-v1');
  assert.equal(r.summary.blockedDrafts,0);
  assert.equal(r.summary.awaitingHumanEditorialReview,1);
  assert.equal(r.reviews[0].status,'human_editorial_review_required');
  assert.deepEqual(r.reviews[0].reasons,[]);
  for(const flag of [
    'municipalityReferenceAuthenticatedAsIBGE',
    'completenessOfMunicipalitiesVerified',
    'editorialQualityIndependentlyApproved',
    'officialLocalServiceCoverageVerified',
    'publishAllowed','indexingAllowed','customerDisplayAuthorized',
    'networkPerformed'
  ])assert.equal(r[flag],false,flag);
  assert.equal(r.releaseStatus,'HOLD_AUTHENTIC_IBGE_SOURCE_EDITORIAL_AND_RELEASE_APPROVAL');
});
test('UF geocode prefix mismatch is detected even if seven digits are provided',()=>{
  const r=review(input([draft({ibgeCode:'2611606',state:'CE',city:'Recife'})]));
  assert.equal(r.summary.blockedDrafts,1);
  assert.ok(r.reviews[0].reasons.includes('candidate_uf_code_prefix_mismatch'));
  assert.ok(r.reviews[0].reasons.includes('candidate_uf_differs_from_reference'));
});
test('accent-insensitive names match while wrong municipality name fails',()=>{
  const r=review(input([draft({
    ibgeCode:'2611606',state:'PE',city:'RECÍFE'
  })]));
  assert.equal(r.reviews[0].status,'human_editorial_review_required');
  const bad=review(input([draft({city:'Outra Cidade'})]));
  assert.equal(bad.summary.blockedDrafts,1);
  assert.ok(bad.reviews[0].reasons.includes(
    'candidate_city_name_differs_from_reference'));
});
test('missing code is only missing from supplied reference, not nonexistent',()=>{
  const r=review(input([draft({
    ibgeCode:'2300001',state:'CE',city:'Municipio Exemplo'
  })]));
  assert.ok(r.reviews[0].reasons.includes(
    'candidate_missing_from_supplied_reference'));
  assert.equal(r.municipalityReferenceAuthenticatedAsIBGE,false);
});
test('duplicate reference codes block review, not grant official proof',()=>{
  const duplicate={ibgeCode:'2304400',state:'CE',city:'Fortaleza'};
  const r=review(input([draft()],[inventory()],reference([duplicate])));
  assert.equal(r.summary.duplicateReferenceCodes,1);
  assert.equal(r.summary.blockedDrafts,1);
  assert.ok(r.reviews[0].reasons.includes(
    'reference_or_inventory_reconciliation_needs_review'));
});
test('inventory mismatches and unknowns are counted without exposing IDs',()=>{
  const mismatched=inventory({state:'CE'});
  const unknown=inventory({
    ibgeCode:'2600001',state:'PE',
    canonicalPath:'/servicos/site-onepage/outro-municipio/',
    contentSha256:hash('different body x')
  });
  const r=review(input([draft()],[mismatched,unknown]));
  assert.equal(r.summary.inventoryRows,2);
  assert.equal(r.summary.inventoryUfMismatch,1);
  assert.equal(r.summary.inventoryPrefixMismatch,1);
  assert.equal(r.summary.inventoryNotInReference,1);
  assert.equal(r.summary.blockedDrafts,1);
  const safe=JSON.stringify(r);
  for(const sensitive of ['2304400','2611606','2600001','Fortaleza','Recife',
    'outro-municipio','/servicos/'])
    assert.ok(!safe.includes(sensitive),sensitive);
});
test('falsified reference and privileged fields are refused',()=>{
  for(const bad of [
    {...input(),municipalityReference:{
      sourceType:'verified_IBGE_API',entries:reference().entries
    }},
    {...input(),municipalityReference:{
      ...reference(),officiallyVerified:true
    }},
    {...input(),publicationAuthorized:true},
    {...input(),municipalityReference:{
      ...reference(),entries:[{ibgeCode:'2304400',state:'CE',city:'Fortaleza',
        personalEmail:'secret@example.com'}]
    }}
  ])assert.throws(()=>review(bad),/SEO F110/);
  const ref=reference();
  Object.defineProperty(ref.entries[0],'city',{
    enumerable:true,get(){throw Error('PRIVATE_SECRET');}
  });
  assert.throws(()=>review(input([draft()],[inventory()],ref)),/SEO F110/);
  const sym=input();sym[Symbol('superuser')]=true;
  assert.throws(()=>review(sym),/SEO F110/);
});

test('F118 DF and Fernando de Noronha require independent territorial editorial review',()=>{
  const cases=[
    {code:'5300108',state:'DF',city:'Brasília'},
    {code:'2605459',state:'PE',city:'Fernando de Noronha'}
  ];
  for(const exceptional of cases){
    const sample=input(
      [draft({ibgeCode:exceptional.code,state:exceptional.state,
        city:exceptional.city})],
      [inventory()],
      reference([{ibgeCode:exceptional.code,state:exceptional.state,
        city:exceptional.city}])
    );
    const r=review(sample);
    assert.equal(r.summary.blockedDrafts,1);
    assert.ok(r.reviews[0].reasons.includes(
      'known_special_territorial_unit_requires_separate_editorial_review'));
    assert.equal(r.reviews[0].publishingAllowed,false);
    assert.equal(r.legalMunicipalityClassificationVerified,false);
    assert.ok(!JSON.stringify(r).includes(exceptional.code));
    assert.ok(!JSON.stringify(r).includes(exceptional.city));
  }
});
test('F118 known special unit in existing inventory does not block unrelated municipality',()=>{
  const existing=inventory({
    ibgeCode:'2605459',state:'PE',
    canonicalPath:'/servicos/site-onepage/fernando-de-noronha/',
    contentSha256:hash('distinct administrative editorial content')
  });
  const r=review(input(
    [draft()],[existing],
    reference([{ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'}])
  ));
  assert.equal(r.summary.inventoryKnownSpecialTerritorialUnits,1);
  assert.equal(r.summary.blockedDrafts,0);
  assert.equal(r.reviews[0].status,'human_editorial_review_required');
  assert.equal(r.legalMunicipalityClassificationVerified,false);
});
