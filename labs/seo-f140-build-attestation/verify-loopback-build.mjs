/**
 * SEO F140 — bind an audited local compiled-site fingerprint to a HEAD
 * response of an explicitly selected loopback staging reverse proxy.
 *
 * Only 127.0.0.1 is contacted. The response header is a local build
 * consistency assertion, NOT independently authenticated TLS or KMS proof.
 */
import http from 'node:http';
import {reviewLegacyOriginAndLocaleRedirects} from
  '../../src/legacy-origin-locale-redirect-review.mjs';
import {fingerprintCompiledSite} from
  '../../src/compiled-site-fingerprint.mjs';

function exact(v,keys){
  if(!v||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const own=Reflect.ownKeys(v);
  return own.length===keys.length&&own.every(k=>{
    const d=Object.getOwnPropertyDescriptor(v,k);
    return typeof k==='string'&&keys.includes(k)&&
      d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function probeHeader(host,port,timeoutMs){
  return new Promise((resolve,reject)=>{
    const req=http.request({
      hostname:'127.0.0.1',family:4,port,method:'HEAD',path:'/',
      headers:{
        Host:host,
        'X-Forwarded-Proto':'https',
        'X-Imagine-Synthetic-Staging-Review':'f140'
      },
      // F203: bound the full HEAD exchange, including slowly arriving headers.
      agent:false,maxHeaderSize:4096,signal:AbortSignal.timeout(timeoutMs)
    },res=>{
      const fingerprint=res.headers['x-imagine-seo-build-sha256'];
      res.resume();
      resolve({
        status:res.statusCode,
        assertedDigest:typeof fingerprint==='string'?fingerprint:null
      });
    });
    req.on('error',()=>reject(Error('SEO F140: isolated local probe failed')));
    req.setTimeout(timeoutMs,()=>
      req.destroy(Error('SEO F140: local probe deadline')));
    req.end();
  });
}
export async function attestLocalStagingBuild(input){
  if(!exact(input,['migrationInput','buildDirectory','stagingPort','timeoutMs'])||
     process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
     !['testing','staging'].includes(process.env.APP_ENV)||
     !Number.isSafeInteger(input.stagingPort)||
     input.stagingPort<1024||input.stagingPort>65535||
     !Number.isSafeInteger(input.timeoutMs)||
     input.timeoutMs<100||input.timeoutMs>5000)
    throw Error('SEO F140: explicit isolated staging only');
  const plan=reviewLegacyOriginAndLocaleRedirects(input.migrationInput);
  if(plan.reviewStatus==='blocked')
    throw Error('SEO F140: unapproved redirect manifest');
  const build=await fingerprintCompiledSite(input.buildDirectory);
  const host=new URL(input.migrationInput.canonicalOrigin).hostname;
  const observed=await probeHeader(host,input.stagingPort,input.timeoutMs);
  const isExpected=typeof observed.assertedDigest==='string'&&
    /^[a-f0-9]{64}$/.test(observed.assertedDigest)&&
    observed.assertedDigest===build.sha256;
  const matched=observed.status===200&&isExpected;
  return {
    contractVersion:'seo-f140-loopback-static-build-attestation-v1',
    reviewStatus:matched?'human_independent_build_identity_review_required':'blocked',
    summary:{
      localStaticFilesHashed:build.filesHashed,
      localHtmlFilesHashed:build.htmlFilesHashed,
      localStaticBytesHashed:build.totalBytesHashed,
      loopbackHeaderPresent:observed.assertedDigest!==null,
      localProxyHeadReturned200:observed.status===200,
      localBuildDigestMatched:matched
    },
    networkPerformed:true,
    loopbackOnlyConnectionUsed:true,
    buildActuallyHashed:true,
    tlsCertificateAuthenticated:false,
    proxyIdentityAuthenticated:false,
    productionBuildVerified:false,
    remotePublicRedirectsVerified:false,
    googlePropertyVerified:false,
    publicationAuthorized:false,
    releaseStatus:'HOLD_STAGING_TLS_IDENTITY_CONTENT_EQUIVALENCE_AND_HUMAN_APPROVAL'
  };
}
