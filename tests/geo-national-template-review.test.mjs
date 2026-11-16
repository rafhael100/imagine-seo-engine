import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewNationalCityTemplateInventory as check} from '../src/geo-national-template-review.mjs';

const shared='Planejamento editorial direcionado a empresas locais com necessidades específicas de apresentar serviços, orientar visitantes e facilitar a avaliação de soluções digitais. Cada conteúdo deve receber revisão técnica independente para comprovar informações e disponibilidade.';
const entry=(city,state,ibgeCode,text)=>({
 serviceSlug:'criacao-de-sites',ibgeCode,city,state,locale:'pt-BR',
 localContent:text??('Na cidade de '+city+', '+state+', '+shared)
});
const envelope=entries=>({sourceType:'operator_supplied_private_editorial_text_unverified',entries});
test('F168 detects city-only swapped pages across independent municipal batches',()=>{
 const r=check(envelope([
  entry('Fortaleza','CE','2304400'),
  entry('Recife','PE','2611606'),
  entry('Curitiba','PR','4106902','Conteúdo regional genuinamente diferente, apresentando orientações de serviços e planejamento de projetos para o público local. Demonstrações e avaliações de clientes exigem fontes confiáveis e confirmação por equipe independente.')
 ]));
 assert.equal(r.examinedEntries,3);
 assert.equal(r.identicalCitySubstitutionTemplateCount,1);
 assert.equal(r.duplicateMunicipalityServiceLocaleCount,0);
 assert.equal(r.releaseStatus,'HOLD_TEMPLATED_OR_DUPLICATE_CITY_CONTENT');
 assert.deepEqual(r.diagnostics,[{index:1,priorIndex:0,code:'city_substitution_template_duplicate'}]);
 for(const field of ['publicationAuthorized','indexingAuthorized',
  'networkPerformed','nearDuplicateSimilarityVerified','officialIbgeMunicipalitiesVerified'])
  assert.equal(r[field],false);
 assert.doesNotMatch(JSON.stringify(r),/Fortaleza|Recife|Curitiba|Planejamento editorial/);
});
test('F168 rejects duplicate municipality/service/locale even for different text',()=>{
 const r=check(envelope([
  entry('Fortaleza','CE','2304400'),
  entry('Fortaleza','CE','2304400',shared+' A segunda versão acrescenta informações que ainda não justificam duplicar a página deste município.')
 ]));
 assert.equal(r.duplicateMunicipalityServiceLocaleCount,1);
 assert.ok(r.diagnostics.some(d=>d.code==='duplicate_municipality_service_locale'));
});
test('F168 scales to one synthetic national batch without claiming completeness',()=>{
 const entries=Array.from({length:1200},(_,i)=>entry(
   'Cidade '+i,'CE',String(2300000+i),
   'Conteúdo técnico independente para a localidade '+i+' com características urbanas, prioridades empresariais e especificações de serviços digitais. Esta é uma simulação editorial diferente para ensaios e não constitui cobertura nacional nem evidência real.'
 ));
 const r=check(envelope(entries));
 assert.equal(r.examinedEntries,1200);
 assert.equal(r.identicalCitySubstitutionTemplateCount,0);
 assert.equal(r.nationalInventoryCompletenessVerified,false);
 assert.equal(r.releaseStatus,'HOLD_EDITORIAL_IBGE_AND_INDEPENDENT_REVIEW');
});
test('F168 refuses malformed entries, injections and unbounded inputs',()=>{
 const valid=entry('Fortaleza','CE','2304400');
 const wrong=[
  {...valid,localContent:'curto'},
  {...valid,city:'/'},
  {...valid,ibgeCode:'main'},
  {...valid,token:'PRIVATE'},
  {...valid,locale:'xx'},
 ];
 for(const bad of wrong)assert.throws(()=>check(envelope([bad])),/F168/);
 assert.throws(()=>check(envelope([])),/F168/);
 assert.throws(()=>check(envelope([valid,valid, ...Array.from({length:5999},()=>valid)])),/F168/);
 assert.throws(()=>check({...envelope([valid]),publicationAuthorized:true}),/F168/);
 const getter=Object.create(null);Object.defineProperty(getter,'serviceSlug',{
  enumerable:true,get(){throw Error('PRIVATE-TOKEN');}
 });
 for(const k of ['ibgeCode','city','state','locale','localContent'])getter[k]=valid[k];
 assert.throws(()=>check(envelope([getter])),/F168/);
});
