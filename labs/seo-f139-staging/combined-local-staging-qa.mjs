/**
 * SEO F139 — one isolated staging run with three independently validated
 * sources: (1) private GSC page export, (2) local audited compiled HTML,
 * (3) real loopback HEAD receipts via F138.
 *
 * Network NEVER starts if the GSC/manifest or compiled HTML has a blocker.
 * Caller gets private captures separately from a redacted report.
 */
import {reviewOfflineGscLegacyMigrationCoverage} from
  '../../src/gsc-legacy-redirect-coverage.mjs';
import {reviewCompiledLegacyRedirectTargets} from
  '../../src/legacy-redirect-built-site-gate.mjs';
import {reviewOfflineMigrationCrossEvidence} from
  '../../src/migration-cross-evidence-release-gate.mjs';
import {captureLoopbackStaging301} from
  '../seo-f138-loopback/loopback-capture.mjs';

const fields=['gscPageInput','migrationInput','buildDirectory',
  'stagingPort','timeoutMs'];
function exact(v){
  if(!v||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
export async function runIsolatedStagingMigrationQa(input){
  if(!exact(input))throw Error('SEO F139: exact five-part staging input required');
  const preview=reviewOfflineGscLegacyMigrationCoverage({
    gscPageInput:input.gscPageInput,
    legacyMigrationInput:input.migrationInput
  });
  const built=await reviewCompiledLegacyRedirectTargets({
    planInput:input.migrationInput,buildDirectory:input.buildDirectory
  });

  // Abort without network if either independent offline preflight fails.
  const preflightIssues=[];
  if(preview.reviewStatus==='blocked')
    preflightIssues.push('gsc_historical_migration_coverage');
  if(built.reviewStatus==='blocked')
    preflightIssues.push('compiled_html_redirect_destinations');
  if(preflightIssues.length){
    return {
      capture:null,
      report:{
        contractVersion:'seo-f139-isolated-local-staging-full-qa-v1',
        reviewStatus:'blocked',
        blockedComponents:preflightIssues,
        gscCoverageStatus:preview.reviewStatus,
        compiledHtmlStatus:built.reviewStatus,
        httpReceiptStatus:'NOT_PROBED_PRECHECK_BLOCKED',
        summary:{
          suppliedGscPageRows:preview.summary.suppliedGscPageRows,
          redactedGscRows:preview.summary.redactedGscPageRows,
          unmappedGscLegacyRows:preview.summary.uncoveredLegacyGscPageRows,
          compiledHtmlPages:built.summary.auditedRealBuildPages,
          missingBuildDestinations:built.summary.missingTargetRoutes,
          httpReceiptsCollected:0
        },
        networkPerformed:false,
        loopbackProbesPerformed:false,
        productionNetworkTouched:false,
        authenticatedGoogleAccessVerified:false,
        stagingTlsIdentityVerified:false,
        publicationAuthorized:false,
        releaseStatus:'HOLD_PREFLIGHT_GSC_OR_HTML'
      }
    };
  }
  const local=await captureLoopbackStaging301({
    migrationInput:input.migrationInput,
    stagingPort:input.stagingPort,
    timeoutMs:input.timeoutMs
  });
  const combined=await reviewOfflineMigrationCrossEvidence({
    gscPageInput:input.gscPageInput,
    migrationInput:input.migrationInput,
    httpCapture:local.capture,
    buildDirectory:input.buildDirectory
  });
  return {
    capture:local.capture,
    report:{
      contractVersion:'seo-f139-isolated-local-staging-full-qa-v1',
      reviewStatus:combined.reviewStatus,
      blockedComponents:combined.blockedComponents,
      gscCoverageStatus:combined.gscCoverageStatus,
      compiledHtmlStatus:combined.compiledHtmlStatus,
      httpReceiptStatus:combined.httpReceiptStatus,
      summary:{...combined.summary},
      networkPerformed:true,
      loopbackProbesPerformed:true,
      productionNetworkTouched:false,
      authenticatedGoogleAccessVerified:false,
      stagingTlsIdentityVerified:false,
      publicationAuthorized:false,
      releaseStatus:'HOLD_TRUSTED_HTTP_TLS_GOOGLE_AND_HUMAN_STAGING_APPROVAL'
    }
  };
}
