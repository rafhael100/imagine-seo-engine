/**
 * SEO-F72 — Bind operator-supplied query/page responses to an exact F71
 * request blueprint. Verifies shapes and property identity, NOT OAuth grants.
 * This stays local/offline; an authenticated Portal backend is still needed.
 */
import {canonicalProperty} from './gsc-readonly.mjs';
import {isStrictDataArray} from './gsc-strict-arrays.mjs';
import {planOfflineGscQueryPage} from './gsc-query-page-planner.mjs';
import {reviewOfflineGscQueryPagePagination}
  from './gsc-query-page-pagination.mjs';

const PLAN=new Set(['contractVersion','tenantRef','propertyFingerprint',
  'method','url','requiredOAuthScope','authorization','body','sourceType',
  'oauthVerified','propertyAccessVerified','tenantGrantVerified',
  'customerDisplayAuthorized','productionReadAuthorized',
  'networkPerformed','releaseStatus']);
const BODY=new Set(['startDate','endDate','dimensions','type',
  'aggregationType','dataState','rowLimit','startRow']);
const ENVELOPE=new Set(['plan','pages']);
function exactData(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const own=Reflect.ownKeys(value);
  return own.length===keys.size&&own.every(k=>
    typeof k==='string'&&keys.has(k)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value'));
}
function validatePlan(plan){
  if(!exactData(plan,PLAN)||!exactData(plan.body,BODY)||
    !isStrictDataArray(plan.body.dimensions,2)||
    plan.body.dimensions.length!==2||
    typeof plan.url!=='string'||plan.url.length>4096)
    throw Error('SEO GSC query/page binding: incompatible plan');
  const match=/^https:\/\/www\.googleapis\.com\/webmasters\/v3\/sites\/([^/?#]+)\/searchAnalytics\/query$/.exec(plan.url);
  if(!match)throw Error('SEO GSC query/page binding: incompatible plan');
  let property;
  try{
    property=decodeURIComponent(match[1]);
    if(canonicalProperty(property)!==property||
      encodeURIComponent(property)!==match[1])
      throw Error('invalid');
  }catch{
    throw Error('SEO GSC query/page binding: incompatible plan');
  }
  let expected;
  try{
    expected=planOfflineGscQueryPage({
      tenantRef:plan.tenantRef,siteUrl:property,
      startDate:plan.body.startDate,endDate:plan.body.endDate,
      authorizationConfirmed:true,
      rowLimit:plan.body.rowLimit,startRow:plan.body.startRow
    });
  }catch{
    throw Error('SEO GSC query/page binding: incompatible plan');
  }
  for(const key of PLAN){
    if(key!=='body'&&plan[key]!==expected[key])
      throw Error('SEO GSC query/page binding: incompatible plan');
  }
  for(const key of BODY){
    if(key==='dimensions'){
      if(plan.body.dimensions[0]!=='query'||
        plan.body.dimensions[1]!=='page')
        throw Error('SEO GSC query/page binding: incompatible plan');
    }else if(plan.body[key]!==expected.body[key])
      throw Error('SEO GSC query/page binding: incompatible plan');
  }
  if(plan.body.startRow!==0)
    throw Error('SEO GSC query/page binding: batch must start at zero');
  return property;
}

export function reviewOfflineGscQueryPagePlannedBatch(input){
  if(!exactData(input,ENVELOPE))
    throw Error('SEO GSC query/page binding: exact plan and pages required');
  const property=validatePlan(input.plan);
  const p=input.plan;
  const report=reviewOfflineGscQueryPagePagination(input.pages,{
    tenantRef:p.tenantRef,siteUrl:property,
    propertyFingerprint:p.propertyFingerprint,
    startDate:p.body.startDate,endDate:p.body.endDate,
    rowLimit:p.body.rowLimit
  });
  return {
    ...report,
    contractVersion:'seo-gsc-query-page-planned-review-offline-v1',
    planContractVersion:p.contractVersion,
    sourceType:'operator_supplied_pages_bound_to_unverified_request_plan',
    oauthVerified:false,
    tenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_AUTHENTICATED_PORTAL_INTEGRATION'
  };
}
