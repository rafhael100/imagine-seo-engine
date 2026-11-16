import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewMunicipalI18nParity as review} from '../src/geo-i18n-parity-review.mjs';

const digest=s=>createHash('sha256').update(s).digest('hex');
const inventory=entries=>({sourceType:'operator_local_inventory_unverified',entries});
function entry(locale='pt-BR',change={}){
  const path={
    'pt-BR':'/servicos/site-onepage/fortaleza-ce/',
    'en-US':'/en/sites/onepage/fortaleza/',
    'es-ES':'/es/sitios/onepage/fortaleza/'
  };
  return {
    serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',locale,
    canonicalPath:path[locale],contentSha256:digest('unique-'+locale),
    ...change
  };
}
test('full PT/EN/ES inventory is review-only, never publish-ready',()=>{
  const output=review(inventory([entry(),entry('en-US'),entry('es-ES')]));
  assert.equal(output.reviewStatus,'human_multilingual_editorial_review_required');
  assert.deepEqual(output.requiredLocales,['pt-BR','en-US','es-ES']);
  assert.deepEqual(output.summary,{
    inspectedEntries:3,serviceMunicipalityGroups:1,completeLocaleGroups:1,
    incompleteLocaleGroups:0,missingLocaleSlots:0,stateMismatchGroups:0,
    wrongLocalePrefixCount:0,inventoryConflicts:0,omittedIncompleteGroups:0,
    omittedStateMismatchGroups:0,omittedWrongLocaleIndices:0
  });
  for(const flag of ['officialIbgeVerified','trueTranslationQualityVerified',
    'businessLocalPresenceVerified','humanEditorialApprovalVerified',
    'publicBuildVerified','googleIndexingVerified','publicationAuthorized',
    'indexingAuthorized','customerDisplayAuthorized','networkPerformed'])
    assert.equal(output[flag],false,flag);
});
test('missing languages are reported by ordinal, never city or route',()=>{
  const output=review(inventory([entry()]));
  assert.equal(output.reviewStatus,'corrections_required');
  assert.equal(output.summary.missingLocaleSlots,2);
  assert.deepEqual(output.incompleteGroups,[
    {firstInventoryIndex:0,missingLocales:['en-US','es-ES']}
  ]);
  for(const hidden of ['fortaleza-ce','2304400','site-onepage',entry().contentSha256])
    assert.equal(JSON.stringify(output).includes(hidden),false,hidden);
});
test('orphan EN and ES locale variants require PT as well',()=>{
  const output=review(inventory([entry('en-US'),entry('es-ES')]));
  assert.deepEqual(output.incompleteGroups,[{
    firstInventoryIndex:0,missingLocales:['pt-BR']
  }]);
});
test('locale path conventions are checked independent of declared lang',()=>{
  const output=review(inventory([
    entry('pt-BR',{canonicalPath:'/en/servicos/site-onepage/fortaleza/'}),
    entry('en-US',{canonicalPath:'/servicos/site-onepage/fortaleza-en/'}),
    entry('es-ES',{canonicalPath:'/en/sitios/onepage/fortaleza/'})
  ]));
  assert.equal(output.summary.wrongLocalePrefixCount,3);
  assert.deepEqual(output.wrongLocalePrefixIndices,[0,1,2]);
  assert.equal(output.summary.incompleteLocaleGroups,0);
  assert.equal(output.reviewStatus,'corrections_required');
});
test('same IBGE code with conflicting UF cannot pass multilingual rollout',()=>{
  const output=review(inventory([entry(),entry('en-US',{state:'PE'}),entry('es-ES')]));
  assert.equal(output.summary.stateMismatchGroups,1);
  assert.deepEqual(output.stateMismatchIndices,[0]);
  assert.equal(output.summary.inventoryConflicts,0);
  assert.equal(output.reviewStatus,'corrections_required');
});
test('preserve F108 collision controls for duplicate locale and page digest',()=>{
  const output=review(inventory([entry(),entry('en-US'),entry('es-ES'),entry()]));
  assert.ok(output.summary.inventoryConflicts>=3);
  assert.equal(output.reviewStatus,'corrections_required');
});
test('unexpected PII, unknown schema, malformed URLs and sparse arrays fail closed',()=>{
  const invalid=[
    {sourceType:'official',entries:[entry()]},
    inventory([entry('pt-BR',{personalLead:'123'})]),
    inventory([entry('pt-BR',{canonicalPath:'https://example.com/secret'})]),
    inventory([])
  ];
  for(const candidate of invalid)
    assert.throws(()=>review(candidate),/SEO F108: invalid bounded offline inventory/);
  const sparse=Array(2);sparse[0]=entry();
  assert.throws(()=>review(inventory(sparse)),/SEO F108/);
  const getter=entry();
  Object.defineProperty(getter,'locale',{enumerable:true,get(){throw Error('private');}});
  assert.throws(()=>review(inventory([getter])),/SEO F108/);
});
test('5,600 city-service groups are bounded, deterministic and do not leak identities',()=>{
  const rows=[];
  for(let i=0;i<5600;i++){
    const ibgeCode=String(2000000+i);
    for(const [locale,prefix] of [
      ['pt-BR','/servicos/'],['en-US','/en/servicos/'],['es-ES','/es/servicos/']
    ]){
      rows.push(entry(locale,{ibgeCode,
        canonicalPath:prefix+'territorio-'+i+'/',
        contentSha256:digest(ibgeCode+'-'+locale)
      }));
    }
  }
  const valid=review(inventory(rows));
  assert.equal(valid.summary.completeLocaleGroups,5600);
  assert.equal(valid.summary.incompleteLocaleGroups,0);
  assert.equal(valid.summary.inventoryConflicts,0);
  const incomplete=rows.filter((_,index)=>index%3===0);
  const bad=review(inventory(incomplete));
  assert.equal(bad.summary.incompleteLocaleGroups,5600);
  assert.equal(bad.summary.missingLocaleSlots,11200);
  assert.equal(bad.incompleteGroups.length,200);
  assert.equal(bad.summary.omittedIncompleteGroups,5400);
  assert.equal(bad.incompleteGroups[0].firstInventoryIndex,0);
  assert.equal(bad.incompleteGroups[199].firstInventoryIndex,199);
  assert.equal(JSON.stringify(bad).includes('2000000'),false);
});
