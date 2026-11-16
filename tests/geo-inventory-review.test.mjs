import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewMunicipalPageInventory as review} from '../src/geo-inventory-review.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const entry=(change={})=>({
  serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
  locale:'pt-BR',canonicalPath:'/servicos/site-onepage/fortaleza-ce/',
  contentSha256:hash('real operator body fixture f108'),
  ...change
});
const input=entries=>({sourceType:'operator_local_inventory_unverified',entries});
test('valid inventory signals only editorial review, never authorized indexing',()=>{
  const x=review(input([entry()]));
  assert.equal(x.status,'human_editorial_review_required');
  assert.deepEqual(x.summary,{
    inspectedEntries:1,distinctMunicipalityServiceLocaleKeys:1,
    distinctCanonicalPaths:1,distinctDeclaredBodyHashes:1,
    municipalityServiceLocaleCollisions:0,canonicalPathCollisions:0,
    identicalBodyDigestCollisions:0,conflictCount:0,
    emittedConflictCount:0,truncatedConflicts:false
  });
  for(const k of [
    'officialIbgeVerified','municipalityStateMappingVerified',
    'contentDigestMatchedToRealPage','inventoryCompletenessVerified',
    'actualPublicationVerified','nearDuplicateContentChecked',
    'publishAllowed','indexingAllowed','customerDisplayAuthorized','networkPerformed'
  ])assert.equal(x[k],false,k);
  assert.equal(x.releaseStatus,'HOLD_OFFICIAL_IBGE_GLOBAL_INVENTORY_AND_EDITORIAL_REVIEW');
});
test('same municipality/service/locale detects conflict even when page URL changes',()=>{
  const a=entry(),b=entry({
    canonicalPath:'/servicos/site-onepage/fortaleza-new/',
    contentSha256:hash('different genuine editorial content')
  });
  const x=review(input([a,b]));
  assert.equal(x.summary.municipalityServiceLocaleCollisions,1);
  assert.equal(x.summary.canonicalPathCollisions,0);
  assert.equal(x.summary.identicalBodyDigestCollisions,0);
  assert.deepEqual(x.conflicts,[{
    itemIndex:1,earlierItemIndex:0,code:'municipalityServiceLocaleCollisions'
  }]);
  assert.equal(x.status,'corrections_required');
});
test('distinct cities may not claim the same canonical path or identical submitted content',()=>{
  const x=review(input([
    entry(),
    entry({ibgeCode:'2611606',state:'PE'})
  ]));
  assert.equal(x.summary.municipalityServiceLocaleCollisions,0);
  assert.equal(x.summary.canonicalPathCollisions,1);
  assert.equal(x.summary.identicalBodyDigestCollisions,1);
  assert.deepEqual(x.conflicts.map(k=>k.code),[
    'canonicalPathCollisions','identicalBodyDigestCollisions'
  ]);
});
test('legitimate locales have distinct page identities and distinct paths',()=>{
  const x=review(input([
    entry(),
    entry({locale:'en-US',canonicalPath:'/en/sites/onepage/fortaleza/',
      contentSha256:hash('English-language independently written content')}),
    entry({locale:'es-ES',canonicalPath:'/es/sitios/onepage/fortaleza/',
      contentSha256:hash('Contenido independiente escrito en espanol')})
  ]));
  assert.equal(x.summary.conflictCount,0);
  assert.equal(x.summary.distinctMunicipalityServiceLocaleKeys,3);
});
test('privacy: no URL, municipality code, city, content hash or service leaked in output',()=>{
  const x=review(input([entry(),entry({
    ibgeCode:'2611606',state:'PE'
  })]));
  const output=JSON.stringify(x);
  for(const secret of ['2304400','2611606','fortaleza-ce','site-onepage',entry().contentSha256])
    assert.ok(!output.includes(secret),secret);
  assert.equal(x.conflicts.length,2);
});
test('rejects unknown fields, unauthorized source, getters, symbols, sparse arrays',()=>{
  const bad=[
    input([]),input([entry({accessToken:'PRIVATE'})]),
    {...input([entry()]),sourceType:'official_ibge_verified'},
    {...input([entry()]),dataVerified:true},
    input([entry({canonicalPath:'/../secret/'})]),
    input([entry({canonicalPath:'https://example.com/'})]),
    input([entry({ibgeCode:'00000000'})]),
    input([entry({state:'XX'})]),
    input([entry({locale:'fr-FR'})]),
    input([entry({contentSha256:'not-hash'})]),
    input([entry({serviceSlug:'Site Onepage'})])
  ];
  for(const v of bad)assert.throws(()=>review(v),/SEO F108: invalid bounded offline inventory/);
  const evil=entry();
  Object.defineProperty(evil,'canonicalPath',{enumerable:true,get(){throw Error('private');}});
  assert.throws(()=>review(input([evil])),/invalid bounded offline inventory/);
  const sym=entry();sym[Symbol('secret')]=true;
  assert.throws(()=>review(input([sym])),/invalid bounded offline inventory/);
  const sparse=Array(2);sparse[0]=entry();
  assert.throws(()=>review(input(sparse)),/invalid bounded offline inventory/);
});
test('bounded conflict diagnostics and 5k+ entries remain deterministic and private',()=>{
  const entries=Array.from({length:5700},(_,i)=>entry({
    ibgeCode:String(2000000+i),state:'CE',
    canonicalPath:'/servicos/site-onepage/regiao-'+String(i)+'/',
    contentSha256:hash('body-'+String(i))
  }));
  const x=review(input(entries));
  assert.equal(x.summary.inspectedEntries,5700);
  assert.equal(x.summary.conflictCount,0);
  const repeated=Array.from({length:300},()=>entry());
  const b=review(input(repeated));
  assert.equal(b.summary.conflictCount,3*299);
  assert.equal(b.conflicts.length,200);
  assert.equal(b.summary.truncatedConflicts,true);
  assert.equal(b.summary.emittedConflictCount,200);
});
test('refuses over 50000 entries and malformed arrays',()=>{
  const entries=Array.from({length:50001},()=>entry());
  assert.throws(()=>review(input(entries)),/invalid bounded offline inventory/);
  const list=[entry()];list.note='secret';
  assert.throws(()=>review(input(list)),/invalid bounded offline inventory/);
});
