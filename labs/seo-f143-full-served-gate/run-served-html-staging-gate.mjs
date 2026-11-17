/**
 * SEO F143 — one fail-closed staging gate for GSC historical origins,
 * approved 301s, compiled HTML, proxy build digest and ACTUAL GET body
 * parity. The network layer remains isolated in labs/, never in src/.
 */
import {runAttestedStagingMigrationQa} from
  '../seo-f141-staging/attested-full-migration-qa.mjs';
import {reviewLoopbackServedHtmlParity} from
  '../seo-f142-body-parity/review-loopback-served-html.mjs';
import {fingerprintCompiledSite} from
  '../../src/compiled-site-fingerprint.mjs';

const FIELDS=['gscPageInput','migrationInput','buildDirectory',
  'stagingPort','timeoutMs'];
function exact(v){
  if(!v||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===FIELDS.length&&keys.every(k=>{
    const d=Object.getOwnPropertyDescriptor(v,k);
    return typeof k==='string'&&FIELDS.includes(k)&&
      d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function safeSummary(input){
  return {
    ...input,
    servedGetRoutesChecked:0,
    identicalServedHtmlRoutes:0,
    alteredServedHtmlRoutes:0
  };
}
export async function runServedHtmlAttestedStagingQa(input){
  if(!exact(input))
    throw Error('SEO F143: exact five-field private staging contract required');
  const prior=await runAttestedStagingMigrationQa(input);
  if(prior.report.reviewStatus==='blocked'){
    return {
      capture:prior.capture,
      report:{
        contractVersion:'seo-f143-served-html-attested-staging-gate-v1',
        reviewStatus:'blocked',
        blockedComponents:[...prior.report.blockedComponents],
        summary:safeSummary(prior.report.summary),
        servedHtmlStatus:'NOT_PROBED_PREVIOUS_BLOCKER',
        networkPerformed:prior.report.networkPerformed,
        loopbackOnlyConnectionUsed:prior.report.loopbackOnlyConnectionUsed,
        priorHttpStatus:prior.report.httpReceiptStatus,
        productionReleaseAuthorized:false,
        publicTlsIdentityVerified:false,
        realGscGrantVerified:false,
        editorialEquivalenceApproved:false,
        customerDisplayAuthorized:false,
        releaseStatus:'HOLD_STAGING_PUBLISHING_PRECONDITIONS'
      }
    };
  }
  if(prior.report.reviewStatus!==
       'human_independent_attested_staging_review_required'||
     !prior.report.buildStableDuringQa||
     !prior.report.buildDigestMatchedInLocalProxy)
    throw Error('SEO F143: prior evidence inconsistent');

  const before=await fingerprintCompiledSite(input.buildDirectory);
  const served=await reviewLoopbackServedHtmlParity({
    migrationInput:input.migrationInput,
    buildDirectory:input.buildDirectory,
    stagingPort:input.stagingPort,
    timeoutMs:input.timeoutMs
  });
  const after=await fingerprintCompiledSite(input.buildDirectory);
  const stable=before.sha256===after.sha256&&
    before.filesHashed===after.filesHashed&&
    before.totalBytesHashed===after.totalBytesHashed;
  const denied=[];
  if(served.reviewStatus==='blocked'){
    const httpRobotsCode=code=>code.startsWith('http_robots_');
    if(served.failureIndices.some(f=>httpRobotsCode(f.code)))
      denied.push('served_html_http_robots_policy_blocked');
    if(served.failureIndices.some(f=>!httpRobotsCode(f.code)))
      denied.push('served_html_bytes_differ_from_audited_build');
  }
  if(!stable)denied.push('compiled_build_modified_during_served_get_audit');

  return {
    capture:prior.capture,
    report:{
      contractVersion:'seo-f143-served-html-attested-staging-gate-v1',
      reviewStatus:denied.length?'blocked':
        'human_independent_served_html_staging_review_required',
      blockedComponents:denied,
      summary:{
        ...prior.report.summary,
        servedGetRoutesChecked:served.summary.loopbackGetRequests,
        identicalServedHtmlRoutes:served.summary.identicalHtmlResponses,
        alteredServedHtmlRoutes:
          served.summary.loopbackGetRequests-served.summary.identicalHtmlResponses
      },
      servedHtmlStatus:served.reviewStatus,
      networkPerformed:true,
      loopbackOnlyConnectionUsed:true,
      buildDigestMatchedInLocalProxy:true,
      buildStableDuringQa:prior.report.buildStableDuringQa,
      priorHttpStatus:prior.report.httpReceiptStatus,
      buildStableDuringGetAudit:stable,
      buildBytesChecked:true,
      realLoopbackGetPerformed:true,
      productionReleaseAuthorized:false,
      publicTlsIdentityVerified:false,
      realGscGrantVerified:false,
      editorialEquivalenceApproved:false,
      customerDisplayAuthorized:false,
      releaseStatus:'HOLD_STAGING_PUBLISHING_PRECONDITIONS'
    }
  };
}
