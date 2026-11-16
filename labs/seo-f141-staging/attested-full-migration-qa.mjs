/**
 * SEO F141 — single release-HOLD gate with GSC+compiled HTML preflight,
 * local build-header parity, actual loopback redirect HEAD and postcheck.
 *
 * Data sources remain operator-supplied and unverified; this is NOT a
 * publication permission, TLS proof, remote redirect test or live GSC API.
 */
import {reviewOfflineGscLegacyMigrationCoverage} from
  '../../src/gsc-legacy-redirect-coverage.mjs';
import {reviewCompiledLegacyRedirectTargets} from
  '../../src/legacy-redirect-built-site-gate.mjs';
import {fingerprintCompiledSite} from
  '../../src/compiled-site-fingerprint.mjs';
import {attestLocalStagingBuild} from
  '../seo-f140-build-attestation/verify-loopback-build.mjs';
import {runIsolatedStagingMigrationQa} from
  '../seo-f139-staging/combined-local-staging-qa.mjs';

const FIELDS=['gscPageInput','migrationInput','buildDirectory',
  'stagingPort','timeoutMs'];
const exact=(v)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(v))&&
  Reflect.ownKeys(v).length===FIELDS.length&&
  Reflect.ownKeys(v).every(k=>{
    if(typeof k!=='string'||!FIELDS.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
function blocked(blockedComponents,summary,httpStatus,probed){
  return {
    contractVersion:'seo-f141-attested-staging-release-gate-v1',
    reviewStatus:'blocked',
    blockedComponents,
    summary,
    httpReceiptStatus:httpStatus,
    buildDigestMatchedInLocalProxy:false,
    buildStableDuringQa:null,
    networkPerformed:probed,
    loopbackOnlyConnectionUsed:probed,
    authenticatedGooglePropertyVerified:false,
    stagingTlsIdentityAuthenticated:false,
    productionRedirectsVerified:false,
    productionReleaseAuthorized:false,
    customerDisplayAuthorized:false,
    releaseStatus:'HOLD_INDEPENDENT_STAGING_AND_EDITORIAL_APPROVAL'
  };
}
export async function runAttestedStagingMigrationQa(input){
  if(!exact(input))throw Error('SEO F141: exact GSC, manifest, build and port required');
  // Offline checks FIRST: never contact even loopback with bad GSC/HTML.
  const gsc=reviewOfflineGscLegacyMigrationCoverage({
    gscPageInput:input.gscPageInput,
    legacyMigrationInput:input.migrationInput
  });
  const site=await reviewCompiledLegacyRedirectTargets({
    planInput:input.migrationInput,buildDirectory:input.buildDirectory
  });
  const flags=[];
  if(gsc.reviewStatus==='blocked')flags.push('gsc_historical_migration_coverage');
  if(site.reviewStatus==='blocked')flags.push('compiled_html_redirect_destinations');
  if(flags.length)return {capture:null,report:blocked(flags,{
    gscPageRows:gsc.summary.suppliedGscPageRows,
    privateGscRowsRedacted:gsc.summary.redactedGscPageRows,
    localCompiledHtmlPages:site.summary.auditedRealBuildPages,
    missingRedirectBuildDestinations:site.summary.missingTargetRoutes,
    loopbackRedirectReceipts:0
  },'NOT_PROBED_PRECHECK_BLOCKED',false)};

  // Fingerprint before, verify the proxy header, fingerprint after.
  const before=await fingerprintCompiledSite(input.buildDirectory);
  const attestation=await attestLocalStagingBuild({
    migrationInput:input.migrationInput,
    buildDirectory:input.buildDirectory,
    stagingPort:input.stagingPort,
    timeoutMs:input.timeoutMs
  });
  if(attestation.reviewStatus==='blocked')
    return {capture:null,report:blocked(['loopback_build_identity_mismatch'],{
      gscPageRows:gsc.summary.suppliedGscPageRows,
      localCompiledHtmlPages:site.summary.auditedRealBuildPages,
      localBuildDigestMatched:false,
      loopbackRedirectReceipts:0
    },'NOT_PROBED_BUILD_IDENTITY_BLOCKED',true)};

  const checked=await runIsolatedStagingMigrationQa(input);
  const after=await fingerprintCompiledSite(input.buildDirectory);
  const stable=before.sha256===after.sha256&&
    before.filesHashed===after.filesHashed;
  const blocklist=[...checked.report.blockedComponents];
  if(!stable)blocklist.push('compiled_build_changed_during_review');
  const status=blocklist.length?'blocked':
    'human_independent_attested_staging_review_required';
  return {
    capture:checked.capture,
    report:{
      contractVersion:'seo-f141-attested-staging-release-gate-v1',
      reviewStatus:status,
      blockedComponents:blocklist,
      summary:{...checked.report.summary},
      httpReceiptStatus:checked.report.httpReceiptStatus,
      buildDigestMatchedInLocalProxy:true,
      buildStableDuringQa:stable,
      networkPerformed:true,
      loopbackOnlyConnectionUsed:true,
      authenticatedGooglePropertyVerified:false,
      stagingTlsIdentityAuthenticated:false,
      productionRedirectsVerified:false,
      productionReleaseAuthorized:false,
      customerDisplayAuthorized:false,
      releaseStatus:'HOLD_INDEPENDENT_STAGING_AND_EDITORIAL_APPROVAL'
    }
  };
}
