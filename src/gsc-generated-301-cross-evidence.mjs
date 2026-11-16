/**
 * SEO F186 — ONE READ-ONLY review of the complete migration chain:
 * GSC PAGE rows -> F185 conservative private 301 proposals -> F134
 * independent HTTP receipts -> F128 compiled Astro target validation.
 *
 * All original URL/HTTP inputs stay in memory. This module never returns a
 * generated manifest, URL, query, canonical host, response headers or HTML.
 * No network or file writes; the compiled build is read locally by F136.
 *
 * A green laboratory result cannot certify GSC OAuth, tenant identity,
 * production redirects, page equivalence or human release authorization.
 */
import {proposePrivateGscBuildRedirects} from
 './gsc-private-compiled-redirect-drafts.mjs';
import {reviewOfflineMigrationCrossEvidence} from
 './migration-cross-evidence-release-gate.mjs';

const FIELDS=['gscPageInput','targetRoutes','httpCapture','buildDirectory'];
function exact(value,fields){
 if(value===null||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value))||
    Reflect.ownKeys(value).length!==fields.length)return false;
 return fields.every(key=>{
  const desc=Object.getOwnPropertyDescriptor(value,key);
  return desc?.enumerable===true&&Object.hasOwn(desc,'value');
 });
}
const authority=Object.freeze({
 originalGscSourceAuthenticated:false,
 backendTenantGrantVerified:false,
 trustedStagingHttpAuthenticated:false,
 legacyContentEquivalenceApproved:false,
 redirectDeploymentAuthorized:false,
 publicationAuthorized:false,
 customerDisplayAuthorized:false,
 networkPerformed:false,
 releaseStatus:'HOLD_BACKEND_GSC_STAGING_EDITORIAL_AND_HUMAN_APPROVAL'
});

/**
 * @param {object} input ORIGINAL untrusted GSC PAGE rows, local build routes,
 *  independently captured HTTP receipts and local Astro build directory.
 * @returns {Promise<object>} only aggregate audit statistics and HOLD flags.
 */
export async function reviewGeneratedGsc301CrossEvidence(input){
 if(!exact(input,FIELDS)||typeof input.buildDirectory!=='string'||
    !input.buildDirectory||input.buildDirectory.length>2048)
  throw Error('SEO F186: exact private source, HTTP and build inputs required');

 // Recompute F185 from the ORIGINAL PAGE rows and reviewed route list.
 // A claimed prior "approved" redirect report can never be supplied here.
 const proposal=proposePrivateGscBuildRedirects({
  gscPageInput:input.gscPageInput,targetRoutes:input.targetRoutes
 });
 const pub=proposal.publicReport;
 const base={
  contractVersion:'seo-f186-gsc-generated-301-cross-evidence-v1',
  sourceType:'operator_supplied_independent_evidence_unverified',
  paginationIncomplete:pub.paginationIncomplete,
  privateUrlVariantsWithheld:pub.metricsWithheld,
  proposedRedirects:null,
  examinedGscPageRows:null,
  checkedHttpReceipts:null,
  missingHttpReceipts:null,
  missingAstroDestinations:null,
  unmatchedGscRows:null,
  independentEvidenceStatus:null,
  reviewStatus:'blocked',
  ...authority
 };

 // A partial or redacted PAGE export must NEVER be treated as a complete
 // migration candidate. No HTTP/build read occurs and no manifest is emitted.
 if(pub.metricsWithheld||pub.paginationIncomplete||!proposal.privateManifest)
  return Object.freeze({
   ...base,
   reviewStatus:pub.metricsWithheld?'HOLD_PRIVATE_GSC_URL_VARIANTS':
    'HOLD_INCOMPLETE_GSC_PAGINATION'
  });

 // This compound gate independently verifies the ORIGINAL PAGE rows,
 // the generated candidate manifest, the ORIGINAL HTTP receipts and
 // actual compiled HTML. It never trusts a precomputed summary.
 let result;
 try{
  result=await reviewOfflineMigrationCrossEvidence({
   gscPageInput:input.gscPageInput,
   migrationInput:proposal.privateManifest,
   httpCapture:input.httpCapture,
   buildDirectory:input.buildDirectory
  });
 }catch{
  // Node filesystem errors can include private absolute paths. Fail closed
  // with an invariant diagnostic that reveals no operator-supplied values.
  throw Error('SEO F186: independent HTTP or compiled build review failed');
 }

 return Object.freeze({
  ...base,
  reviewStatus:result.reviewStatus==='blocked'?'blocked':
   'human_independent_release_review_required',
  independentEvidenceStatus:result.reviewStatus,
  proposedRedirects:pub.proposedHostSchemeOnly301s,
  examinedGscPageRows:result.summary.suppliedGscPageRows,
  checkedHttpReceipts:result.summary.checkedHttpReceipts,
  missingHttpReceipts:result.summary.missingHttpReceipts,
  missingAstroDestinations:result.summary.missingBuildDestinations,
  unmatchedGscRows:result.summary.observedLegacyGscRowsUnmapped
 });
}
