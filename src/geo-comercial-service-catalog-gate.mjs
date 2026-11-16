/**
 * SEO F180 — bind original municipal drafts to an immutable, reviewed
 * Imagine Comercial service catalog and the launch-planning scope.
 * This code does NOT attest service availability in a particular city.
 */
import {reviewMunicipalSeoDraftBatch} from './geo-batch-preflight.mjs';
import {reviewDraftBatchAgainstPinnedDtb} from './geo-pinned-official-editorial-gate.mjs';

const COMERCIAL_SHA='0fb80e9ea0335c6ee5dd834c63148d58e5c9ff38';
const INITIAL=new Set(['onepage','landing-pages']);
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);

function validatedCatalog(services){
 if(!Array.isArray(services)||Object.getPrototypeOf(services)!==Array.prototype||
    services.length<2||services.length>100||
    Reflect.ownKeys(services).length!==services.length+1)
  throw Error('F180: reviewed bounded Comercial catalog required');
 const set=new Set();
 for(let i=0;i<services.length;i++){
  const d=Object.getOwnPropertyDescriptor(services,String(i));
  const entry=d?.value;
  const slug=entry&&typeof entry==='object'?
    Object.getOwnPropertyDescriptor(entry,'slug'):null;
  if(!d?.enumerable||!entry||typeof entry!=='object'||
     Array.isArray(entry)||!slug?.enumerable||!own(slug,'value')||
     typeof slug.value!=='string'||slug.value.length>72||
     !SLUG.test(slug.value)||set.has(slug.value))
    throw Error('F180: invalid or duplicated Comercial service');
  set.add(slug.value);
 }
 if(![...INITIAL].every(slug=>set.has(slug)))
  throw Error('F180: initial Onepage and Landing Page products absent');
 return set;
}
/** Testable catalog scope only; always recomputes the original F107 gate. */
export function reviewDraftsAgainstCommercialCatalog({draftBatchInput,services}={}){
 const catalog=validatedCatalog(services);
 const original=reviewMunicipalSeoDraftBatch(draftBatchInput);
 const reviews=original.items.map((item,i)=>{
  const slug=draftBatchInput.candidates[i].serviceSlug;
  const reasons=[...item.reasons];
  if(!catalog.has(slug))reasons.push('service_not_in_pinned_comercial_catalog');
  else if(!INITIAL.has(slug))reasons.push('service_outside_initial_onepage_landing_scope');
  const unique=[...new Set(reasons)];
  return Object.freeze({
   draftIndex:i,status:unique.length?'blocked':'human_editorial_review_required',
   reasons:Object.freeze(unique),publicationAuthorized:false,indexingAuthorized:false
  });
 });
 return Object.freeze({
  contractVersion:'seo-f180-comercial-service-scope-offline-v1',
  comercialCandidateSha:COMERCIAL_SHA,
  catalogServices:catalog.size,
  initialServiceScopeCount:INITIAL.size,
  reviewedDrafts:reviews.length,
  blockedDrafts:reviews.filter(x=>x.status==='blocked').length,
  reviews:Object.freeze(reviews),
  catalogOriginAuthenticatedByModule:false,
  localServiceAvailabilityVerified:false,
  portalTenantServiceGrantVerified:false,
  publicationAuthorized:false,indexingAuthorized:false,
  networkPerformed:false,
  releaseStatus:'HOLD_COMERCIAL_CATALOG_TENANT_AND_EDITORIAL_REVIEW'
 });
}
/** Production-oriented composition with F179 source binding, never GO. */
export function reviewPinnedMunicipalServiceDrafts(input){
 if(input===null||typeof input!=='object'||Array.isArray(input)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(input))||
    Reflect.ownKeys(input).length!==3||
    !['normalizedDtbCsv','draftBatchInput','services'].every(k=>own(input,k)))
  throw Error('F180: exact official, editorial and catalog inputs required');
 const official=reviewDraftBatchAgainstPinnedDtb({
  normalizedDtbCsv:input.normalizedDtbCsv,
  draftBatchInput:input.draftBatchInput
 });
 const catalog=reviewDraftsAgainstCommercialCatalog({
  draftBatchInput:input.draftBatchInput,services:input.services
 });
 const reviews=official.reviews.map((item,i)=>{
  const other=catalog.reviews[i];
  const reasons=[...new Set([...item.reasons,...other.reasons])];
  return Object.freeze({
   draftIndex:i,status:reasons.length?'blocked':'human_editorial_review_required',
   reasons:Object.freeze(reasons),publicationAuthorized:false,indexingAuthorized:false
  });
 });
 return Object.freeze({
  contractVersion:'seo-f180-official-dtb-and-comercial-catalog-editorial-v1',
  oficialDtbShaPinned:official.officialDtbCsvShaPinned,
  pinnedComercialRevision:COMERCIAL_SHA,
  sourceBoundMunicipalityRows:official.officialDtbRows,
  catalogServices:catalog.catalogServices,
  reviewedDrafts:reviews.length,
  blockedDrafts:reviews.filter(x=>x.status==='blocked').length,
  reviews:Object.freeze(reviews),
  catalogCheckoutCommitVerifiedInThisModule:false,
  tenantServiceEntitlementVerified:false,
  localServiceAvailabilityVerified:false,
  editorialApprovalVerified:false,
  publicationAuthorized:false,indexingAuthorized:false,
  releaseStatus:'HOLD_DTB_CATALOG_TENANT_LOCAL_SERVICE_AND_EDITORIAL_APPROVAL'
 });
}
