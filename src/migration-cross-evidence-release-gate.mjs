/**
 * SEO F136 — three independent migration evidence layers in one read-only
 * gate: GSC operator observations, HTTP 301 operator receipts, actual local
 * compiled HTML. No network or publishing authority.
 */
import {reviewOfflineGscLegacyMigrationCoverage} from './gsc-legacy-redirect-coverage.mjs';
import {reviewOfflineLegacyHttp301Receipts} from './legacy-http301-receipt-review.mjs';
import {reviewCompiledLegacyRedirectTargets} from './legacy-redirect-built-site-gate.mjs';

function exact(v,fields){
  if(!v||typeof v!=='object'||Array.isArray(v)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
export async function reviewOfflineMigrationCrossEvidence(input){
  if(!exact(input,['gscPageInput','migrationInput','httpCapture','buildDirectory'])||
     typeof input.buildDirectory!=='string')
    throw Error('SEO F136: exact four-part offline evidence required');
  // All external inputs are fully validated synchronously before awaiting
  // local filesystem work. Do not accept caller-authored summary objects.
  const coverage=reviewOfflineGscLegacyMigrationCoverage({
    gscPageInput:input.gscPageInput,legacyMigrationInput:input.migrationInput
  });
  const receipts=reviewOfflineLegacyHttp301Receipts({
    migrationInput:input.migrationInput,capture:input.httpCapture
  });
  const m=input.migrationInput;
  const immutablePlan={
    sourceType:m.sourceType,siteDomain:m.siteDomain,
    canonicalOrigin:m.canonicalOrigin,
    legacyUrls:[...m.legacyUrls],targetRoutes:[...m.targetRoutes],
    candidates:m.candidates.map(c=>({
      fromUrl:c.fromUrl,toPath:c.toPath,status:c.status
    }))
  };
  const built=await reviewCompiledLegacyRedirectTargets({
    planInput:immutablePlan,buildDirectory:input.buildDirectory
  });
  const blockers=[];
  if(coverage.reviewStatus==='blocked')
    blockers.push('gsc_historical_migration_coverage');
  if(receipts.reviewStatus==='blocked')
    blockers.push('http_redirect_receipt_evidence');
  if(built.reviewStatus==='blocked')
    blockers.push('compiled_html_redirect_destinations');
  return {
    contractVersion:'seo-f136-cross-evidence-migration-release-gate-offline-v1',
    reviewStatus:blockers.length?'blocked':'human_independent_release_review_required',
    blockedComponents:blockers,
    summary:{
      suppliedGscPageRows:coverage.summary.suppliedGscPageRows,
      gscRowsRedacted:coverage.summary.redactedGscPageRows,
      observedLegacyGscRowsUnmapped:coverage.summary.uncoveredLegacyGscPageRows,
      unscopedGscSubdomainRows:coverage.summary.otherSubdomainGscPageRows,
      checkedHttpReceipts:receipts.summary.suppliedReceipts,
      requiredHttp301Receipts:receipts.summary.expectedRedirects,
      validHttp301Receipts:receipts.summary.matched301ToCanonical,
      missingHttpReceipts:receipts.summary.missingReceiptCount,
      httpReceiptWrongStatus:receipts.summary.wrongRedirectStatusCount,
      httpReceiptWrongLocation:receipts.summary.wrongLocationOrFinalUrlCount,
      httpReceiptWrongFinalStatus:receipts.summary.wrongFinalStatusCount,
      httpReceiptExtraHops:receipts.summary.extraHopsCount,
      auditedLocalHtmlPages:built.summary.auditedRealBuildPages,
      missingBuildDestinations:built.summary.missingTargetRoutes,
      htmlTechnicalErrors:built.summary.staticHtmlErrors,
      sitemapOmissions:built.summary.pagesNotInSitemap
    },
    gscCoverageStatus:coverage.reviewStatus,
    httpReceiptStatus:receipts.reviewStatus,
    compiledHtmlStatus:built.reviewStatus,
    compiledHtmlActuallyAudited:true,
    authenticatedGoogleDataVerified:false,
    httpCaptureOriginVerified:false,
    actualRedirectsVerifiedInTrustedStaging:false,
    sourceTenantAndKeyVerified:false,
    editorialEquivalenceApproved:false,
    realProductionReleaseAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_TRUSTED_GSC_HTTP_STAGING_EDITORIAL_AND_ROLLBACK'
  };
}
