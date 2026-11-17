/**
 * SEO F121 — sign a REAL offline F114/F117 build review with a caller-owned
 * Ed25519 private key. Restricted to CI lab; never generates a key or accepts
 * a web-request-supplied tenant in production. The outer signature does NOT
 * authenticate real identity, signer custody, Google, IBGE or live deployment.
 */
import {createHash,randomBytes,sign,KeyObject} from 'node:crypto';
import {reviewMunicipalStaticBuild} from './geo-static-build-review.mjs';

const PREFIX=Buffer.from('IMAGINE-SEO-F122-SIGNED-BUILD-REPORT\n','ascii');
const exact=(v,names)=>{
  if(v===null||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===names.length&&keys.every(k=>{
    if(typeof k!=='string'||!names.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
};
/**
 * Sign the full result computed from local files, not an external JSON
 * statement claiming an audit was run. Callers supply the trust context and
 * key as TEST-ONLY local trusted parameters, never browser input.
 */
export async function signLocalMunicipalBuildEvidence(
  auditInput,verifiedLabContext,privateKey,issuedAt
){
  if(process.env.CI!=='true' ||
     process.env.APP_ENV!=='testing' ||
     process.env.SEO_F121_SIGNER_LAB!=='1' ||
     !exact(verifiedLabContext,['tenantRef','runRef','engineCommitSha']) ||
     typeof verifiedLabContext.tenantRef!=='string' ||
     !/^[a-z0-9][a-z0-9_-]{1,79}$/.test(verifiedLabContext.tenantRef) ||
     typeof verifiedLabContext.runRef!=='string' ||
     !/^[a-zA-Z0-9:_-]{3,100}$/.test(verifiedLabContext.runRef) ||
     typeof verifiedLabContext.engineCommitSha!=='string' ||
     !/^[a-f0-9]{40}$/.test(verifiedLabContext.engineCommitSha) ||
     !(privateKey instanceof KeyObject) ||
     privateKey.type!=='private' ||
     privateKey.asymmetricKeyType!=='ed25519' ||
     !Number.isSafeInteger(issuedAt) ||
     issuedAt<1700000000 || issuedAt>4102444000)
    throw Error('SEO F121: test-only trusted signing context required');

  // Re-audit actual local HTML with all the Engine's canonical,
  // hreflang, sitemap, inventory, robots and private-preview gates.
  const report=await reviewMunicipalStaticBuild(auditInput);
  const reportRaw=Buffer.from(JSON.stringify(report),'utf8');
  if(reportRaw.byteLength<100||reportRaw.byteLength>100000)
    throw Error('SEO F121: bounded audit result required');
  const payload={
    issuer:'imagine-seo-engine-ci-lab',
    audience:'imagine-portal-ci-lab',
    tenantRef:verifiedLabContext.tenantRef,
    runRef:verifiedLabContext.runRef,
    engineCommitSha:verifiedLabContext.engineCommitSha,
    issuedAt,
    expiresAt:issuedAt+240,
    nonce:randomBytes(24).toString('base64url'),
    reportSha256:createHash('sha256').update(reportRaw).digest('hex'),
    reportBase64:reportRaw.toString('base64')
  };
  const bytes=Buffer.from(JSON.stringify(payload),'utf8');
  const signature=sign(null,Buffer.concat([PREFIX,bytes]),privateKey);
  const envelope={
    contractVersion:'seo-f122-signed-build-report-v1',
    payloadBase64:bytes.toString('base64'),
    signatureBase64:signature.toString('base64')
  };
  return {
    envelope,
    reviewStatus:report.reviewStatus,
    auditedRealLocalFiles:true,
    realSignerCustodyVerified:false,
    realTenantAuthenticated:false,
    replayLedgerLinked:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_REAL_SIGNER_TENANT_REPLAY_AND_STAGING'
  };
}
