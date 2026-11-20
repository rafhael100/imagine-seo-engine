import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewIbgeReceiptAndNationalCoverage as review} from
  '../src/ibge-receipt-national-crosscheck.mjs';
import {OFFICIAL_IBGE_MUNICIPALITIES_URL} from
  '../src/ibge-official-https-capture.mjs';

const PREFIX={
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
};
function reference(){
 const states=Object.entries(PREFIX).filter(([x])=>x!=='DF');
 const entries=Array.from({length:5569},(_,i)=>{
  const [state,prefix]=states[i%states.length];
  return {
   ibgeCode:prefix+String(Math.floor(i/states.length)+1).padStart(5,'0'),
   state,city:'Cidade Sintética '+String(i+1)
  };
 });
 entries.push({ibgeCode:'5300108',state:'DF',city:'Brasília'});
 entries.push({ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'});
 entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 return {
  sourceType:'operator_supplied_municipality_reference_unverified',
  entries
 };
}
const sha=text=>createHash('sha256').update(text).digest('hex');
function fixture(ref=reference()){
 const text=JSON.stringify(ref,null,2)+'\n';
 const receipt={
  contractVersion:'seo-f117-ibge-https-source-capture-v1',
  sourceUrl:OFFICIAL_IBGE_MUNICIPALITIES_URL,
  retrievedAtUtc:'2026-11-16T12:00:00.000Z',
  transport:'node_https_exact_official_hostname_no_redirect',
  rawJsonSha256:'a'.repeat(64),
  normalizedReferenceSha256:sha(text),
  rawBytes:500000,
  referenceEntries:ref.entries.length,
  officialHostnameAndTransportChecked:true,
  rawContentSignedByIbge:false,
  territorialEditionConfirmed:false,
  municipalityClassificationVerified:false,
  allMunicipalitiesCovered:false,
  publicationAuthorized:false,
  indexingAuthorized:false,
  networkPerformed:true,
  releaseStatus:'HOLD_SOURCE_EDITION_COVERAGE_EDITORIAL_AND_PUBLICATION_REVIEW'
 };
 return {normalizedReferenceText:text,captureReceipt:receipt};
}
test('F154 reconciles local F117 receipt with F153 coverage without claiming official identity',()=>{
 const out=review(fixture());
 assert.equal(out.reviewStatus,'human_provenance_territorial_edition_review_required');
 assert.equal(out.summary.referenceEntries,5571);
 assert.equal(out.summary.candidateMunicipalities,5569);
 assert.equal(out.summary.specialDistricts,2);
 assert.equal(out.summary.federationUnitsPresent,27);
 assert.equal(out.captureReceiptVerifiedAgainstLocalBytes,true);
 assert.equal(out.sourceAuthenticatedByIndependentChannel,false);
 assert.equal(out.edition2025LegallyConfirmed,false);
 assert.equal(out.publicationAuthorized,false);
 assert.equal(out.indexingAuthorized,false);
 assert.equal(out.networkPerformed,false);
 assert.doesNotMatch(JSON.stringify(out),/Cidade Sint[eé]tica|Bras[ií]lia|Fernando de Noronha/);
});
test('F154 blocks incomplete source even when signed receipt matches its exact bytes',()=>{
 const source=reference();
 source.entries=source.entries.filter(x=>x.ibgeCode!=='2605459');
 const out=review(fixture(source));
 assert.equal(out.reviewStatus,'blocked');
 assert.ok(out.blockedComponents.includes('expectedLocalityRows'));
 assert.equal(out.captureReceiptVerifiedAgainstLocalBytes,true);
 assert.equal(out.publicationAuthorized,false);
});
test('F154 rejects mutated normalized JSON or invented official authority',()=>{
 const input=fixture();
 const manipulated={...input,
  normalizedReferenceText:input.normalizedReferenceText.replace(
    'Cidade Sintética','Nome Falsificado')
 };
 assert.throws(()=>review(manipulated),/digest mismatch/);
 const falseApproval=fixture();
 falseApproval.captureReceipt.publicationAuthorized=true;
 assert.throws(()=>review(falseApproval),/SEO F117/);
 const extra=fixture();
 extra.approveMerge=true;
 assert.throws(()=>review(extra),/SEO F154/);
});
