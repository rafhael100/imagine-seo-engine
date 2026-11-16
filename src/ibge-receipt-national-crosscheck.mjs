/**
 * SEO F154 — offline reconciliation of F117 HTTPS capture receipt with
 * F153 MMD 2025 national structural coverage. The receipt is supplied by
 * the operator and can be forged; only independent provenance/edition review
 * could authenticate it. Never authorizes publication or Google indexing.
 */
import {verifyIbgeSourceReceipt} from './ibge-source-receipt-review.mjs';
import {reviewIbgeMmd2025NationalCoverage} from
  './ibge-national-edition-coverage.mjs';

const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(v))&&
  Reflect.ownKeys(v).length===keys.length&&
  Reflect.ownKeys(v).every(k=>{
    const d=Object.getOwnPropertyDescriptor(v,k);
    return typeof k==='string'&&keys.includes(k)&&
      d?.enumerable===true&&Object.hasOwn(d,'value');
  });
export function reviewIbgeReceiptAndNationalCoverage(input){
  if(!exact(input,['normalizedReferenceText','captureReceipt'])||
     typeof input.normalizedReferenceText!=='string'||
     input.normalizedReferenceText.length>2*1024*1024)
    throw Error('SEO F154: exact bounded receipt and reference required');

  // Always verify the supplied digest/contract before reading the snapshot.
  const receipt=verifyIbgeSourceReceipt(
    input.normalizedReferenceText,input.captureReceipt
  );
  let reference;
  try{reference=JSON.parse(input.normalizedReferenceText);}
  catch{throw Error('SEO F154: invalid normalized reference');}
  const national=reviewIbgeMmd2025NationalCoverage({
    reference,editionId:'IBGE_MMD_2025'
  });
  const blocked=national.reviewStatus==='blocked';
  return {
    contractVersion:'seo-f154-ibge-captured-directory-national-crosscheck-v1',
    reviewStatus:blocked?'blocked':
      'human_provenance_territorial_edition_review_required',
    blockedComponents:[...national.blockedComponents],
    summary:{
      referenceEntries:receipt.referenceEntries,
      candidateMunicipalities:national.summary.municipalityCandidateRows,
      specialDistricts:national.summary.knownSpecialDistrictRows,
      federationUnitsPresent:national.summary.federationUnitsPresent,
      missingOrInvalidNationalChecks:national.blockedComponents.length,
      normalizedReferenceDigestMatched:receipt.normalizedDigestMatches
    },
    captureReceiptVerifiedAgainstLocalBytes:true,
    officialHostnameObservedAtClaimedCapture:
      receipt.officialHostObservedAtCapture,
    sourceAuthenticatedByIndependentChannel:false,
    edition2025LegallyConfirmed:false,
    municipalityClassificationFullyVerified:false,
    realLocalServicesVerified:false,
    editorialQualityApproved:false,
    indexingAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_INDEPENDENT_IBGE_SOURCE_EDITION_EDITORIAL_AND_RELEASE_APPROVAL'
  };
}
