/**
 * SEO F215: join untrusted, independently supplied canonical declarations and
 * target GET status observations. Offline only. Never fetch, redirect or deploy.
 */
import {isStrictDataArray} from './gsc-strict-arrays.mjs';

const SCHEMA='imagine.seo.canonical-target-http-evidence.v1';
const PAGE_SOURCE='operator_supplied_public_html_metadata_unverified';
const TARGET_SOURCE='operator_supplied_independent_public_http_get_unverified';
const MAX_DIAGNOSTICS=200;
const fail=()=>{throw Error('SEO F215: invalid or untrusted canonical HTTP evidence');};
function exact(value,fields){
 if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
 const keys=Reflect.ownKeys(value);
 return keys.length===fields.length&&keys.every(key=>{
  const d=Object.getOwnPropertyDescriptor(value,key);
  return typeof key==='string'&&fields.includes(key)&&
   d?.enumerable===true&&Object.hasOwn(d,'value');
 });
}
function strictUrl(value){
 if(typeof value!=='string'||value.length<9||value.length>1000||
    /[?#\u0000-\u0020\u007f]/.test(value))fail();
 let parsed;
 try{parsed=new URL(value);}catch{fail();}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||
    parsed.search||parsed.hash||parsed.href!==value||!parsed.hostname||
    parsed.hostname.length>253)fail();
 return parsed;
}
function strictOrigin(value){
 if(typeof value!=='string'||value.length<9||value.length>260||
    /[/?#\u0000-\u0020\u007f]/.test(value.slice('https://'.length)))fail();
 let parsed;
 try{parsed=new URL(value);}catch{fail();}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||
    parsed.port||parsed.origin!==value||parsed.pathname!=='/'||
    parsed.search||parsed.hash)fail();
 return parsed.origin;
}
const validStatus=value=>Number.isInteger(value)&&value>=200&&value<=599;
export function reviewCanonicalTargetHttpEvidence(input){
 if(!exact(input,['schema','siteOrigin','pageEvidence','targetEvidence'])||
    input.schema!==SCHEMA||
    !exact(input.pageEvidence,['sourceType','observations'])||
    input.pageEvidence.sourceType!==PAGE_SOURCE||
    !exact(input.targetEvidence,['sourceType','observations'])||
    input.targetEvidence.sourceType!==TARGET_SOURCE||
    !isStrictDataArray(input.pageEvidence.observations,2000)||
    !isStrictDataArray(input.targetEvidence.observations,2000))fail();
 const origin=strictOrigin(input.siteOrigin);
 const targets=new Map();
 for(const item of input.targetEvidence.observations){
  if(!exact(item,['targetUrl','status'])||!validStatus(item.status))fail();
  const url=strictUrl(item.targetUrl);
  if(url.origin!==origin||targets.has(item.targetUrl))fail();
  targets.set(item.targetUrl,item.status);
 }
 const summary={
  pagesObserved:0,canonicalDeclarations:0,missingCanonicalDeclarations:0,
  offOriginCanonicalDeclarations:0,selfCanonicalDeclarations:0,
  nonSelfCanonicalDeclarations:0,canonicalTargetHttp200Declarations:0,
  redirectedCanonicalDeclarations:0,failedCanonicalDeclarations:0,
  unobservedCanonicalTargets:0,distinctDeclaredTargets:0,
  distinctObservedTargets:targets.size,redirectedDistinctTargets:0,
  omittedDiagnostics:0
 };
 const seenPages=new Set(),declared=new Set(),redirected=new Set(),diagnostics=[];
 const flag=(pageIndex,code)=>{
  if(diagnostics.length<MAX_DIAGNOSTICS)diagnostics.push({pageIndex,code});
  else summary.omittedDiagnostics++;
 };
 for(const [index,item] of input.pageEvidence.observations.entries()){
  if(!exact(item,['pageUrl','pageStatus','canonicalHref'])||
     item.pageStatus!==200||
     (item.canonicalHref!==null&&typeof item.canonicalHref!=='string'))fail();
  const page=strictUrl(item.pageUrl);
  if(page.origin!==origin||seenPages.has(item.pageUrl))fail();
  seenPages.add(item.pageUrl);summary.pagesObserved++;
  if(item.canonicalHref===null){
   summary.missingCanonicalDeclarations++;flag(index,'missing_canonical');continue;
  }
  const canonical=strictUrl(item.canonicalHref);
  summary.canonicalDeclarations++;
  if(canonical.origin!==origin){
   summary.offOriginCanonicalDeclarations++;flag(index,'off_origin_canonical');continue;
  }
  declared.add(item.canonicalHref);
  if(item.canonicalHref===item.pageUrl)summary.selfCanonicalDeclarations++;
  else summary.nonSelfCanonicalDeclarations++;
  if(!targets.has(item.canonicalHref)){
   summary.unobservedCanonicalTargets++;flag(index,'canonical_target_unobserved');continue;
  }
  const status=targets.get(item.canonicalHref);
  if(status===200)summary.canonicalTargetHttp200Declarations++;
  else if(status>=300&&status<=399){
   summary.redirectedCanonicalDeclarations++;redirected.add(item.canonicalHref);
   flag(index,'canonical_target_redirect');
  }else{
   summary.failedCanonicalDeclarations++;flag(index,'canonical_target_non_200');
  }
 }
 if([...targets.keys()].some(url=>!declared.has(url)))fail();
 summary.distinctDeclaredTargets=declared.size;
 summary.redirectedDistinctTargets=redirected.size;
 const blocked=summary.missingCanonicalDeclarations+
  summary.offOriginCanonicalDeclarations+summary.unobservedCanonicalTargets+
  summary.redirectedCanonicalDeclarations+summary.failedCanonicalDeclarations>0;
 return Object.freeze({
  schema:'imagine.seo.canonical-target-http-review.v1',
  reviewStatus:blocked?'blocked':'human_editorial_http_review_required',
  summary:Object.freeze(summary),
  diagnostics:Object.freeze(diagnostics.map(d=>Object.freeze(d))),
  exactUrlJoin:true,
  observationSource:'operator_supplied_unverified_public_metadata',
  observedHttpStatusesAuthenticated:false,
  redirectsFollowed:false,targetContentEquivalenceVerified:false,
  searchIndexationVerified:false,releaseAuthorized:false,redirectsAuthorized:0,
  networkPerformed:false,containsInputUrls:false
 });
}
