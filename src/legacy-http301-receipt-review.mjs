/**
 * SEO F134 — review operator-captured HTTP 301 receipts against F127's
 * approved legacy migration manifest, entirely OFFLINE.
 *
 * This module neither runs curl nor proves a receipt came from staging.
 * It never publishes URLs, origins, headers or private request metadata.
 */
import {reviewLegacyOriginAndLocaleRedirects} from
  './legacy-origin-locale-redirect-review.mjs';
import {isStrictDataArray} from './gsc-strict-arrays.mjs';

const CAPTURE=['sourceType','observations'];
const REQUEST=['fromUrl','status','location','finalUrl','finalStatus','redirectHops'];
const MAX=20000,DIAGNOSTICS=200;
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
export function reviewOfflineLegacyHttp301Receipts(input){
  if(!exact(input,['migrationInput','capture'])||
     !exact(input.capture,CAPTURE)||
     input.capture.sourceType!=='operator_supplied_http_head_captures_unverified'||
     !isStrictDataArray(input.capture.observations,MAX))
    throw Error('SEO F134: exact bounded operator HTTP receipts required');
  const review=reviewLegacyOriginAndLocaleRedirects(input.migrationInput);
  const manifest=input.migrationInput;
  const expected=new Map(manifest.candidates.map((c,index)=>[
    c.fromUrl,{index,expected:manifest.canonicalOrigin.slice(0,-1)+c.toPath}
  ]));
  const seen=new Set();
  const diagnostics=[];
  const counters={
    suppliedReceipts:input.capture.observations.length,
    expectedRedirects:expected.size,
    matched301ToCanonical:0,
    missingReceiptCount:0,
    wrongRedirectStatusCount:0,
    wrongLocationOrFinalUrlCount:0,
    wrongFinalStatusCount:0,
    extraHopsCount:0,
    omittedDiagnostics:0
  };
  const push=(candidateIndex,receiptIndex,code)=>{
    if(diagnostics.length<DIAGNOSTICS)
      diagnostics.push({candidateIndex,receiptIndex,code});
  };
  for(let i=0;i<input.capture.observations.length;i++){
    const record=input.capture.observations[i];
    if(!exact(record,REQUEST)||typeof record.fromUrl!=='string'||
       !expected.has(record.fromUrl)||seen.has(record.fromUrl)||
       typeof record.location!=='string'||record.location.length>900||
       typeof record.finalUrl!=='string'||record.finalUrl.length>900||
       !Number.isSafeInteger(record.status)||record.status<100||record.status>599||
       !Number.isSafeInteger(record.finalStatus)||
       record.finalStatus<100||record.finalStatus>599||
       !Number.isSafeInteger(record.redirectHops)||
       record.redirectHops<0||record.redirectHops>8)
      throw Error('SEO F134: unlisted, duplicate or unsafe receipt');
    seen.add(record.fromUrl);
    const plan=expected.get(record.fromUrl);
    let broken=false;
    if(record.status!==301){
      counters.wrongRedirectStatusCount++;
      push(plan.index,i,'wrong_redirect_status');
      broken=true;
    }
    if(record.location!==plan.expected||record.finalUrl!==plan.expected){
      counters.wrongLocationOrFinalUrlCount++;
      push(plan.index,i,'wrong_canonical_target');
      broken=true;
    }
    if(record.finalStatus!==200){
      counters.wrongFinalStatusCount++;
      push(plan.index,i,'wrong_final_status');
      broken=true;
    }
    if(record.redirectHops!==1){
      counters.extraHopsCount++;
      push(plan.index,i,'not_one_exact_redirect_hop');
      broken=true;
    }
    if(!broken)counters.matched301ToCanonical++;
  }
  for(const [url,plan] of expected){
    if(!seen.has(url)){
      counters.missingReceiptCount++;
      push(plan.index,null,'missing_http_receipt');
    }
  }
  const count=counters.missingReceiptCount+counters.wrongRedirectStatusCount+
    counters.wrongLocationOrFinalUrlCount+counters.wrongFinalStatusCount+
    counters.extraHopsCount;
  counters.omittedDiagnostics=count-diagnostics.length;
  const blocked=review.reviewStatus==='blocked'||count>0;
  return {
    contractVersion:'seo-f134-observed-301-staging-receipt-offline-v1',
    reviewStatus:blocked?'blocked':'human_http_staging_review_required',
    summary:counters,diagnostics,
    manifestStatus:review.reviewStatus,
    observationSource:'operator_supplied_not_network_authenticated',
    actualHttpCaptureAuthenticated:false,
    tlsCertificateValidatedByThisModule:false,
    redirectTargetEditoriallyVerified:false,
    stagingOriginVerified:false,
    productionRedirectsVerified:false,
    realDeploymentAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_TRUSTED_STAGING_CAPTURE_CONTENT_EQUIVALENCE_AND_ROLLBACK'
  };
}
