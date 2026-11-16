import test from 'node:test';
import assert from 'node:assert/strict';
import {
 compareDraftBatchToDtbRows as compare,
 reviewDraftBatchAgainstPinnedDtb as pinned
} from '../src/geo-pinned-official-editorial-gate.mjs';

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
  source:'editorial_research',observedAt:'2026-11-09',
  explanation:'Pesquisa manual documentada, ainda sem volume de busca verificado ou ranking estimado.'
 }],...overrides
});
const batch=(entries)=>({candidates:entries,existing:[],maxSimilarity:0.75});
const rows=new Map([
 ['2304400',{state:'CE',city:'Fortaleza'}],
 ['2611606',{state:'PE',city:'Recife'}],
 ['5300108',{state:'DF',city:'Brasília'}]
]);
test('F179 matches authorized official code and retains human editorial HOLD',()=>{
 const result=compare({draftBatchInput:batch([candidate()]),rows});
 assert.equal(result.matchedOfficialDtbCodes,1);
 assert.equal(result.blockedDrafts,0);
 assert.equal(result.awaitingHumanEditorialReview,1);
 assert.equal(result.reviews[0].status,'human_editorial_review_required');
 assert.equal(result.publicationAuthorized,false);
 assert.equal(result.indexingAuthorized,false);
 assert.equal(result.editorialContentIndependentlyApproved,false);
 assert.doesNotMatch(JSON.stringify(result),/Fortaleza|2304400|A equipe avalia/);
});
test('F179 blocks forged city, UF and unknown municipality codes',()=>{
 for(const [change,code] of [
  [{city:'Cidade não oficial'},'municipality_name_differs_from_pinned_official_dtb'],
  [{state:'PE'},'municipality_uf_differs_from_pinned_official_dtb'],
  [{ibgeCode:'2300000'},'municipality_code_not_in_pinned_official_dtb']
 ]){
  const r=compare({draftBatchInput:batch([candidate(change)]),rows});
  assert.equal(r.blockedDrafts,1);
  assert.ok(r.reviews[0].reasons.includes(code));
  assert.equal(r.publicationAuthorized,false);
 }
});
test('F179 always blocks Brasília as a territorial special unit',()=>{
 const r=compare({draftBatchInput:batch([candidate({
  ibgeCode:'5300108',state:'DF',city:'Brasília',localContent:paragraph('Brasília')
 })]),rows});
 assert.equal(r.specialTerritorialDrafts,1);
 assert.equal(r.blockedDrafts,1);
 assert.ok(r.reviews[0].reasons.includes('special_territorial_unit_not_ordinary_municipality'));
});
test('F179 retains F107 templated city-content block across two candidate rows',()=>{
 const r=compare({draftBatchInput:batch([
  candidate(),candidate({
   ibgeCode:'2611606',state:'PE',city:'Recife',localContent:paragraph('Recife')
  })
 ]),rows});
 assert.equal(r.examinedDrafts,2);
 assert.equal(r.matchedOfficialDtbCodes,2);
 assert.equal(r.blockedDrafts,1);
 assert.ok(r.reviews[1].reasons.includes('possible_templated_or_duplicate_location_content'));
});
test('F179 rejects fabricated source receipts, missing original inputs and leaked approvals',()=>{
 const original=batch([candidate()]);
 for(const input of [
  {normalizedDtbCsv:'synthetic',draftBatchInput:original},
  {normalizedDtbCsv:'synthetic',draftBatchInput:original,publicationAuthorized:true},
  {normalizedDtbCsv:'',draftBatchInput:original},
  {normalizedDtbCsv:'synthetic'},
  null
 ])assert.throws(()=>pinned(input),/F179/);
 assert.throws(()=>compare({draftBatchInput:{...original,publishAllowed:true},rows}),/SEO F107/);
});
