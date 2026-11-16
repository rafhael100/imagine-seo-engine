/**
 * SEO F138 — isolated laboratory, manually authorized loopback-ONLY HTTP HEAD verification
 * of F127 legacy redirects against a trusted local staging proxy.
 *
 * Intentionally kept OUT of src/ and scripts/: F77 forbids network in production/offline code.\n * All TCP requests are hardcoded to 127.0.0.1. Public origin and Host are
 * only headers; this code NEVER resolves them or follows a Location URL.
 * No cookies, tokens or request bodies; zero production publication rights.
 */
import {request} from 'node:http';
import {reviewLegacyOriginAndLocaleRedirects} from
  '../../src/legacy-origin-locale-redirect-review.mjs';
import {reviewOfflineLegacyHttp301Receipts} from
  '../../src/legacy-http301-receipt-review.mjs';

const MAX_PROBES=100;
function exact(x,fields){
  if(!x||typeof x!=='object'||Array.isArray(x)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(x)))return false;
  const keys=Reflect.ownKeys(x);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(x,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
async function localHead(port,host,path){
  return await new Promise((resolve,reject)=>{
    const req=request({
      protocol:'http:',hostname:'127.0.0.1',port,
      method:'HEAD',path,
      agent:false,timeout:2500,maxHeaderSize:8192,
      headers:{Host:host,'User-Agent':'imagine-seo-f138-local-readonly',
        Connection:'close'}
    },response=>{
      const status=response.statusCode;
      const location=response.headers.location;
      // Consume no response body and follow no redirect.
      response.destroy();
      resolve({status:Number.isSafeInteger(status)?status:599,
        location:typeof location==='string'&&location.length<=900?
          location:''});
    });
    req.on('timeout',()=>req.destroy(new Error('local timeout')));
    req.on('error',()=>reject(Error('SEO F138: local probe unavailable')));
    req.end();
  });
}

/**
 * The loopbackPort must be explicitly declared and an operator must opt in.
 * A green result means HUMAN REVIEW, not authenticated TLS or live 301.
 */
export async function probeLoopbackLegacyRedirects(input){
  if(!exact(input,['migrationInput','loopbackPort'])||
     process.env.SEO_F138_ALLOW_LOCAL_HEAD!=='1'||
     !Number.isSafeInteger(input.loopbackPort)||
     input.loopbackPort<1024||input.loopbackPort>65535)
    throw Error('SEO F138: local HEAD test requires explicit approval and port');
  const migration=reviewLegacyOriginAndLocaleRedirects(input.migrationInput);
  const m=input.migrationInput;
  if(m.candidates.length<1||m.candidates.length>MAX_PROBES||
     migration.reviewStatus==='blocked')
    throw Error('SEO F138: bounded approved redirect manifest required');
  const port=input.loopbackPort;
  const canonicalHost=m.siteDomain;
  const expectedPrefix='https://'+canonicalHost;
  const receipts=[];
  // One request to the legacy host and, only if it targets the exact trusted
  // canonical HTTPS URL, one more HEAD on the local listener for final status.
  for(const c of m.candidates){
    const source=new URL(c.fromUrl);
    const expected=expectedPrefix+c.toPath;
    const first=await localHead(port,source.hostname,source.pathname);
    let finalUrl='',finalStatus=599,redirectHops=0;
    if(first.location){
      redirectHops=1;
      if(first.location===expected){
        const final=await localHead(port,canonicalHost,c.toPath);
        finalUrl=expected;
        finalStatus=final.status;
        if(final.status>=300&&final.status<400)redirectHops=2;
      }
    }
    receipts.push({
      fromUrl:c.fromUrl,status:first.status,location:first.location,
      finalUrl,finalStatus,redirectHops
    });
  }
  const reviewed=reviewOfflineLegacyHttp301Receipts({
    migrationInput:m,
    capture:{
      sourceType:'operator_supplied_http_head_captures_unverified',
      observations:receipts
    }
  });
  return {
    contractVersion:'seo-f138-loopback-observed-redirects-v1',
    reviewStatus:reviewed.reviewStatus,
    summary:reviewed.summary,
    diagnostics:reviewed.diagnostics,
    localHeadRequestsPerformed:true,
    loopbackAddressPinned:true,
    publicInternetRequested:false,
    externalDnsResolutionPerformed:false,
    actualPublicTlsVerified:false,
    trustedStagingIdentityVerified:false,
    productionRedirectsVerified:false,
    publicationAuthorized:false,
    customerDisplayAuthorized:false,
    releaseStatus:'HOLD_REAL_TLS_STAGING_IDENTITY_SEO_EQUIVALENCE_AND_ROLLBACK'
  };
}
