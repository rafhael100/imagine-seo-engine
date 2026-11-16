/** F162 — document completeness only; never authenticate evidence or grant release. */
const required=Object.freeze([
 'independent_code_review',
 'ibge_source_authentication',
 'municipal_editorial_review',
 'gsc_tenant_authorization',
 'portal_crm_consent_review',
 'leaseweb_staging_security',
 'backup_restore_drill',
 'rollback_drill',
 'human_release_decision'
]);
const sha=/^[a-f0-9]{40}$/;
const receipt=/^[a-f0-9]{64}$/;
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const recordKeys=['gate','candidateSha','evidenceDigest','sourceClass','reviewed'];
export function assessSeoReleaseEvidence(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||
  Object.getPrototypeOf(input)!==Object.prototype||
  Reflect.ownKeys(input).length!==2||!own(input,'candidateSha')||
  !own(input,'evidence')||!sha.test(input.candidateSha)||
  !Array.isArray(input.evidence)||input.evidence.length>required.length)
  throw Error('F162: exact candidate and evidence envelope required');
 const observed=new Set();
 const submitted=[];
 for(const item of input.evidence){
  if(!item||typeof item!=='object'||Array.isArray(item)||
    Object.getPrototypeOf(item)!==Object.prototype||
    Reflect.ownKeys(item).length!==recordKeys.length||
    !recordKeys.every(k=>own(item,k))||
    !required.includes(item.gate)||observed.has(item.gate)||
    item.candidateSha!==input.candidateSha||
    !receipt.test(item.evidenceDigest)||
    !['operator_record','independent_review','official_source'].includes(item.sourceClass)||
    item.reviewed!==true)throw Error('F162: malformed, repeated or unverified submitted receipt');
  observed.add(item.gate);submitted.push(item.gate);
 }
 const missing=required.filter(x=>!observed.has(x));
 // Even all externally-submitted receipts can be forged. Authorship, signatures,
 // provenance and actual operating conditions must be independently inspected.
 return Object.freeze({
  contractVersion:'seo-f162-release-evidence-inventory-v1',
  requiredGateCount:required.length,
  submittedReviewedReceipts:submitted.length,
  missingGates:Object.freeze(missing),
  submissionComplete:missing.length===0,
  authenticityVerified:false,
  operationallyHomologated:false,
  independentHumanReleaseRequired:true,
  publicationAuthorized:false,
  mergeAuthorized:false,
  deployAuthorized:false,
  networkPerformed:false,
  releaseStatus:missing.length?'HOLD_MISSING_RELEASE_EVIDENCE':'HOLD_INDEPENDENT_EVIDENCE_AUTHENTICATION'
 });
}
export const SEO_F162_REQUIRED_GATES=required;
