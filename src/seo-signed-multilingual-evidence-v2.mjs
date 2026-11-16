/**
 * SEO F126 — CI-only Ed25519 evidence for FULL local F122/F123/F124 checks.
 * Domain separated from F121's old F114/F117 envelope; never silently
 * upgrade the strict v1 Portal verifier or authorize production release.
 */
import {createHash,randomBytes,sign,KeyObject} from 'node:crypto';
import {reviewMunicipalMultilingualBuild} from './geo-multilingual-build-gate.mjs';

export const MULTILINGUAL_PREFIX=Buffer.from(
  'IMAGINE-SEO-F126-SIGNED-MULTILINGUAL-REVIEW\n','ascii'
);
const SUMMARY_FIELDS=Object.freeze([
  'inspectedEntries','serviceMunicipalityGroups','incompleteLocaleGroups',
  'missingLocaleSlots','stateMismatchGroups','wrongLocalePrefixCount',
  'inventoryConflicts','auditedBuildPages','expectedRoutesMissing',
  'expectedRoutesWrongLocale','technicalErrors','privateEditorialPreviewLeaks',
  'missingHreflangLinks','wrongHreflangTargets','ambiguousHreflangAliases'
]);
function exact(v,fields){
  if(v===null||typeof v!=='object'||Array.isArray(v)||
      ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function trustedContext(ctx,privateKey,issuedAt){
  return process.env.CI==='true'&&process.env.APP_ENV==='testing'&&
    process.env.SEO_F126_SIGNER_LAB==='1'&&
    exact(ctx,['tenantRef','runRef','engineCommitSha'])&&
    typeof ctx.tenantRef==='string'&&
    /^[a-z0-9][a-z0-9_-]{1,79}$/.test(ctx.tenantRef)&&
    typeof ctx.runRef==='string'&&
    /^[a-zA-Z0-9:_-]{3,100}$/.test(ctx.runRef)&&
    typeof ctx.engineCommitSha==='string'&&
    /^[a-f0-9]{40}$/.test(ctx.engineCommitSha)&&
    privateKey instanceof KeyObject&&privateKey.type==='private'&&
    privateKey.asymmetricKeyType==='ed25519'&&
    Number.isSafeInteger(issuedAt)&&issuedAt>=1700000000&&issuedAt<=4102444000;
}
/**
 * Audit actual local static files, construct whitelisted privacy-safe DTO,
 * then sign those exact serialized bytes (not operator-supplied JSON).
 * Caller MUST independently authenticate tenant/run/commit in trusted CI.
 */
export async function signMultilingualBuildEvidence(auditInput,ctx,privateKey,issuedAt){
  if(!trustedContext(ctx,privateKey,issuedAt))
    throw Error('SEO F126: trusted CI-only signer context required');
  const full=await reviewMunicipalMultilingualBuild(auditInput);
  if(!exact(full.summary,SUMMARY_FIELDS)||
     !SUMMARY_FIELDS.every(k=>Number.isSafeInteger(full.summary[k])&&full.summary[k]>=0)||
     !['blocked','human_independent_review_required'].includes(full.reviewStatus)||
     full.publicationAuthorized!==false||
     full.customerDisplayAuthorized!==false||
     full.indexingAuthorized!==false||
     full.networkPerformed!==false||
     full.auditedRealLocalFiles!==true)
    throw Error('SEO F126: invalid audited result');
  const report={
    contractVersion:'seo-municipal-multilingual-review-dto-v2',
    reviewStatus:full.reviewStatus,
    summary:Object.fromEntries(SUMMARY_FIELDS.map(k=>[k,full.summary[k]])),
    inventoryParityStatus:full.localeParity.reviewStatus,
    actualBuildStatus:full.staticBuild.reviewStatus,
    hreflangReviewStatus:full.hreflangCompleteness.reviewStatus,
    auditedRealLocalFiles:true,
    realPublishedSiteVerified:false,
    officialIbgeSourceVerified:false,
    editorialApprovalVerified:false,
    publicationAuthorized:false,
    indexingAuthorized:false,
    customerDisplayAuthorized:false
  };
  const reportRaw=Buffer.from(JSON.stringify(report),'utf8');
  if(reportRaw.byteLength<250||reportRaw.byteLength>16000)
    throw Error('SEO F126: bounded signed report required');
  const payload={
    issuer:'imagine-seo-engine-f126-ci-lab',
    audience:'imagine-portal-f126-ci-lab',
    tenantRef:ctx.tenantRef,
    runRef:ctx.runRef,
    engineCommitSha:ctx.engineCommitSha,
    issuedAt,
    expiresAt:issuedAt+240,
    nonce:randomBytes(24).toString('base64url'),
    reportSha256:createHash('sha256').update(reportRaw).digest('hex'),
    reportBase64:reportRaw.toString('base64')
  };
  const bytes=Buffer.from(JSON.stringify(payload),'utf8');
  if(bytes.length>25000)throw Error('SEO F126: payload over limit');
  const signature=sign(null,Buffer.concat([MULTILINGUAL_PREFIX,bytes]),privateKey);
  return {
    envelope:{
      contractVersion:'seo-f126-signed-multilingual-review-v2',
      payloadBase64:bytes.toString('base64'),
      signatureBase64:signature.toString('base64')
    },
    reviewStatus:full.reviewStatus,
    auditedRealLocalFiles:true,
    realTenantAuthenticated:false,
    trustedProductionSignerVerified:false,
    replayLedgerLinked:false,
    publicationAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_REAL_TENANT_KEY_CUSTODY_REPLAY_AND_STAGING'
  };
}
