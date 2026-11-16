import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewIbgeNationalReferenceDelta as review} from
 '../src/ibge-national-reference-delta.mjs';

const UF={
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
};
function reference(){
 const states=Object.entries(UF).filter(([x])=>x!=='DF');
 const entries=Array.from({length:5569},(_,i)=>{
   const [state,prefix]=states[i%states.length];
   return {ibgeCode:prefix+String(Math.floor(i/states.length)+1).padStart(5,'0'),
     state,city:'Cidade Sintetica '+String(i+1)};
 });
 entries.push({ibgeCode:'5300108',state:'DF',city:'Brasília'});
 entries.push({ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'});
 entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 return {sourceType:'operator_supplied_municipality_reference_unverified',entries};
}
const clone=v=>structuredClone(v);
test('F155 identical unverified snapshots still require official edition review',()=>{
 const previous=reference();
 const out=review({previousReference:previous,newReference:clone(previous)});
 assert.equal(out.reviewStatus,'human_current_edition_and_source_review_required');
 assert.deepEqual(out.blockedComponents,[]);
 assert.equal(out.summary.priorLocalityRows,5571);
 assert.equal(out.summary.currentLocalityRows,5571);
 assert.equal(out.previousOfficialOriginVerified,false);
 assert.equal(out.currentOfficialOriginVerified,false);
 assert.equal(out.indexingAuthorized,false);
 assert.equal(out.publicationAuthorized,false);
 assert.equal(out.networkPerformed,false);
});
test('F155 detects renaming without emitting locality names or codes',()=>{
 const prior=reference(),next=clone(prior);
 const edited=next.entries.find(x=>x.state==='CE');
 edited.city='Nome Ficticio Atualizado';
 const out=review({previousReference:prior,newReference:next});
 assert.equal(out.reviewStatus,'blocked');
 assert.equal(out.summary.changedNames,1);
 assert.deepEqual(out.blockedComponents,['renamed_localities_require_editorial_slug_review']);
 assert.equal(out.redactedSampleIndices[0].kind,'name_change_requires_slug_editorial_review');
 for(const secret of ['Nome Ficticio Atualizado',edited.ibgeCode,'Cidade Sintetica'])
  assert.ok(!JSON.stringify(out).includes(secret));
});
test('F155 blocks added/removed geocodes instead of deleting pages',()=>{
 const prev=reference(),next=clone(prev);
 const removed=next.entries.shift();
 const added={ibgeCode:'2370000',state:'CE',city:'Nova Localidade Sintetica'};
 next.entries.push(added);
 next.entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 const out=review({previousReference:prev,newReference:next});
 assert.equal(out.reviewStatus,'blocked');
 assert.equal(out.summary.newlyObservedGeocodes,1);
 assert.equal(out.summary.noLongerListedGeocodes,1);
 assert.equal(out.historicalPagesDeletedAutomatically,false);
 assert.equal(out.redirectsCreatedAutomatically,false);
 assert.equal(out.redactedSampleIndices.length,2);
 assert.equal(removed.ibgeCode.length,7);
});
test('F155 blocks changes in Brasília special territorial classification',()=>{
 const prev=reference(),next=clone(prev);
 next.entries.find(x=>x.ibgeCode==='5300108').city='Brasilia Renomeada';
 const out=review({previousReference:prev,newReference:next});
 assert.equal(out.summary.specialDistrictChanges,1);
 assert.ok(out.blockedComponents.includes('special_district_classification_changed'));
 assert.equal(out.publicationAuthorized,false);
});
test('F155 rejects incomplete, duplicate, corrupted or extra-privilege inventory',()=>{
 const previous=reference();
 const broken=clone(previous);
 broken.entries=broken.entries.slice(0,3);
 assert.throws(()=>review({previousReference:previous,newReference:broken}),/SEO F155/);
 const duplicate=clone(previous);
 duplicate.entries[1].ibgeCode=duplicate.entries[0].ibgeCode;
 assert.throws(()=>review({previousReference:previous,newReference:duplicate}),/SEO F155/);
 const untrusted={previousReference:previous,newReference:clone(previous),deploy:true};
 assert.throws(()=>review(untrusted),/SEO F155/);
 const badUF=clone(previous);
 badUF.entries.find(x=>x.state==='CE').state='DF';
 assert.throws(()=>review({previousReference:previous,newReference:badUF}),/SEO F155/);
});
