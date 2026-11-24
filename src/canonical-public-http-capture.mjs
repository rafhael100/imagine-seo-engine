/**
 * SEO F217 — bounded, anonymous public GET observations for canonical targets.
 * Hard-pinned to the Imagine legacy HTTPS origin. No redirects, cookies,
 * credentials, form submits, page-body retention or retries.
 * This function is transport-injectable for SYNTHETIC offline tests.
 */
import {reviewCanonicalTargetHttpEvidence}
 from './canonical-target-http-evidence-review.mjs';
const ORIGIN='https://www.imaginecomunicacao.com.br';
const TARGET_SOURCE='operator_supplied_independent_public_http_get_unverified';
const fail=()=>{throw Error('SEO F217: bounded public canonical capture unavailable');};
function exact(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
 const actual=Reflect.ownKeys(value);
 return actual.length===keys.length&&actual.every(key=>{
  const d=Object.getOwnPropertyDescriptor(value,key);
  return typeof key==='string'&&keys.includes(key)&&
   d?.enumerable===true&&Object.hasOwn(d,'value');
 });
}
export async function captureCanonicalPublicHttpEvidence(input,{
 transport=fetch,timeoutMs=7000
}={}){
 if(!exact(input,['schema','siteOrigin','pageEvidence'])||
    input.siteOrigin!==ORIGIN||
    typeof transport!=='function'||!Number.isSafeInteger(timeoutMs)||
    timeoutMs<1000||timeoutMs>10000)fail();
 let check;
 try{
  check=reviewCanonicalTargetHttpEvidence({
   ...input,
   targetEvidence:{sourceType:TARGET_SOURCE,observations:[]}
  });
 }catch{fail();}
 if(check.summary.offOriginCanonicalDeclarations||
    check.summary.canonicalDeclarations===0||
    check.summary.distinctDeclaredTargets<1||
    check.summary.distinctDeclaredTargets>50)fail();
 // Validation above examines every page BEFORE any network request.
 const unique=[...new Set(input.pageEvidence.observations
  .map(item=>item.canonicalHref).filter(item=>item!==null))];
 if(unique.length!==check.summary.distinctDeclaredTargets)fail();
 const observations=[];
 for(const url of unique){
  let response;
  try{
   response=await transport(url,{
    method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',
    headers:{Accept:'text/html'},
    signal:AbortSignal.timeout(timeoutMs)
   });
   if(!(response instanceof Response))fail();
   // F220: release every real response body, including a response rejected
   // below for status, redirect or content type. Never wait on cancellation.
   // The GET AbortSignal remains active as the network cleanup backstop.
   // No response body is parsed, hashed, stored, printed or followed.
   if(response.body)void response.body.cancel().catch(()=>{});
   if(response.redirected||!Number.isInteger(response.status)||
      response.status<200||response.status>599)fail();
   if(response.status===200&&
      response.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='text/html')
    fail();
   observations.push(Object.freeze({targetUrl:url,status:response.status}));
  }catch{fail();}
 }
 return Object.freeze({
  schema:input.schema,siteOrigin:ORIGIN,
  pageEvidence:input.pageEvidence,
  targetEvidence:Object.freeze({sourceType:TARGET_SOURCE,
   observations:Object.freeze(observations)})
 });
}
