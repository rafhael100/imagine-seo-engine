/**
 * SEO F157 — evidence join: a single set of F110 locality bytes must
 * satisfy BOTH the F117 receipt/F154 national coverage gate AND the
 * independently provided IBGE DTB 2025 F156 municipal comparison.
 *
 * Does NOT authenticate either source independently or authorize release.
 * No network, Google, filesystem, outputting names/codes, or mutations.
 */
import {reviewIbgeReceiptAndNationalCoverage} from
  './ibge-receipt-national-crosscheck.mjs';
import {reviewIndependentDtbMunicipalCrosscheck} from
  './ibge-independent-dtb-crosscheck.mjs';

function exact(obj,fields){
 if(obj===null||typeof obj!=='object'||Array.isArray(obj)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(obj))||
    Reflect.ownKeys(obj).length!==fields.length)return false;
 return fields.every(k=>{
  const d=Object.getOwnPropertyDescriptor(obj,k);
  return d?.enumerable===true&&Object.hasOwn(d,'value');
 });
}
export function reviewThreeSourceIbgeEvidence(input){
 if(!exact(input,[
   'normalizedReferenceText','captureReceipt','normalizedDtbCsv'
 ])||typeof input.normalizedReferenceText!=='string'||
   typeof input.normalizedDtbCsv!=='string'||
   Buffer.byteLength(input.normalizedReferenceText,'utf8')>2*1024*1024||
   Buffer.byteLength(input.normalizedDtbCsv,'utf8')>1024*1024)
   throw Error('SEO F157: invalid three-source evidence contract');

 // F154 first: no DTB source is examined until reference bytes match
 // the supplied HTTPS receipt contract.
 const receiptAndCoverage=reviewIbgeReceiptAndNationalCoverage({
  normalizedReferenceText:input.normalizedReferenceText,
  captureReceipt:input.captureReceipt
 });
 let reference;
 try{reference=JSON.parse(input.normalizedReferenceText);}
 catch{throw Error('SEO F157: invalid normalized locality reference');}

 // Same exact byte-verified F110 source, no operator-selected alternate.
 const independentDtb=reviewIndependentDtbMunicipalCrosscheck({
  normalizedDtbCsv:input.normalizedDtbCsv,
  localityReference:reference,
  editionId:'IBGE_DTB_2025'
 });
 const reasons=[...new Set([
  ...receiptAndCoverage.blockedComponents,
  ...independentDtb.blockedComponents
 ])];
 return {
  contractVersion:'seo-f157-ibge-source-national-dtb-three-way-evidence-v1',
  reviewStatus:reasons.length?'blocked':
    'human_official_ibge_provenance_edition_and_editorial_review_required',
  blockedComponents:reasons,
  summary:{
   receiptReferenceEntries:receiptAndCoverage.summary.referenceEntries,
   nationalMunicipalityCandidates:
     receiptAndCoverage.summary.candidateMunicipalities,
   nationalSpecialTerritorialRows:
     receiptAndCoverage.summary.specialDistricts,
   independentDtbRows:independentDtb.summary.dtbRows,
   independentDtbNameMismatches:
     independentDtb.summary.municipalityNameMismatches,
   independentDtbUfMismatches:
     independentDtb.summary.municipalityUfMismatches,
   missingInLocalityReference:
     independentDtb.summary.missingInLocalityReference,
   unexpectedLocalityRows:
     independentDtb.summary.unexpectedLocalityRows,
   redactedSampleCount:independentDtb.summary.redactedSampleCount,
   sameReferenceBytesUsedForBothReviews:true,
   receiptDigestMatchesLocalBytes:
     receiptAndCoverage.summary.normalizedReferenceDigestMatched
  },
  officialHttpsTransportClaimCrosschecked:
    receiptAndCoverage.officialHostnameObservedAtClaimedCapture,
  officialDtbWorkbookAuthenticated:false,
  independentProvenanceVerified:false,
  municipalityLegalEditionIndependentlyConfirmed:false,
  usefulOriginalLocalContentApproved:false,
  tenantGoogleOwnershipVerified:false,
  publicationAuthorized:false,
  indexingAuthorized:false,
  networkPerformed:false,
  releaseStatus:'HOLD_THREE_SOURCE_PROVENANCE_EDITION_EDITORIAL_APPSEC_AND_HUMAN_GO'
 };
}
