import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewThreeSourceIbgeEvidence as review} from
 '../src/ibge-three-source-release-review.mjs';
import {OFFICIAL_IBGE_MUNICIPALITIES_URL} from
 '../src/ibge-official-https-capture.mjs';

const UF={
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
};
const hash=t=>createHash('sha256').update(t).digest('hex');
function fixture(){
 const stateEntries=Object.entries(UF).filter(([s])=>s!=='DF');
 const entries=Array.from({length:5569},(_,i)=>{
  const [state,prefix]=stateEntries[i%stateEntries.length];
  return {ibgeCode:prefix+String(Math.floor(i/stateEntries.length)+1).padStart(5,'0'),
   state,city:'Município Teste '+String(i+1)};
 });
 entries.push({ibgeCode:'5300108',state:'DF',city:'Brasília'});
 entries.push({ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'});
 entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 const normalizedReferenceText=JSON.stringify({
  sourceType:'operator_supplied_municipality_reference_unverified',entries
 },null,2)+'\n';
 const normalizedDtbCsv='ibgeCode;state;city\n'+entries
   .filter(x=>!['5300108','2605459'].includes(x.ibgeCode))
   .map(x=>[x.ibgeCode,x.state,x.city].join(';')).join('\n')+'\n';
 const captureReceipt={
  contractVersion:'seo-f117-ibge-https-source-capture-v1',
  sourceUrl:OFFICIAL_IBGE_MUNICIPALITIES_URL,
  retrievedAtUtc:'2026-11-16T10:00:00.000Z',
  transport:'node_https_exact_official_hostname_no_redirect',
  rawJsonSha256:'a'.repeat(64),
  normalizedReferenceSha256:hash(normalizedReferenceText),
  rawBytes:500000,referenceEntries:entries.length,
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
 return {normalizedReferenceText,normalizedDtbCsv,captureReceipt};
}
test('F157 3-way evidence is bound to exact F117 bytes and aligned DTB',()=>{
 const report=review(fixture());
 assert.equal(report.reviewStatus,
  'human_official_ibge_provenance_edition_and_editorial_review_required');
 assert.equal(report.summary.receiptReferenceEntries,5571);
 assert.equal(report.summary.independentDtbRows,5569);
 assert.equal(report.summary.sameReferenceBytesUsedForBothReviews,true);
 assert.equal(report.summary.receiptDigestMatchesLocalBytes,true);
 assert.equal(report.publicationAuthorized,false);
 assert.equal(report.indexingAuthorized,false);
 assert.equal(report.independentProvenanceVerified,false);
 assert.equal(report.networkPerformed,false);
 const s=JSON.stringify(report);
 for(const sensitive of ['Município Teste','Brasília','Fernando de Noronha',
   '2300001'])assert.ok(!s.includes(sensitive));
});
test('F157 blocks DTB name divergence even though local SHA/receipt matches',()=>{
 const p=fixture();
 p.normalizedDtbCsv=p.normalizedDtbCsv.replace(
  'Município Teste 1\n','Nome Alterado\n');
 const out=review(p);
 assert.equal(out.reviewStatus,'blocked');
 assert.ok(out.blockedComponents.includes('municipality_names_disagree'));
 assert.equal(out.publicationAuthorized,false);
});
test('F157 fails closed on forged receipt or mutated F110 after capture',()=>{
 const p=fixture();
 p.normalizedReferenceText=p.normalizedReferenceText.replace(
   'Município Teste 1','Município Substituído');
 assert.throws(()=>review(p),/digest mismatch/);
 const q=fixture();
 q.captureReceipt.publicationAuthorized=true;
 assert.throws(()=>review(q),/SEO F117/);
 const x=fixture();x.approveDeploy=true;
 assert.throws(()=>review(x),/SEO F157/);
});
