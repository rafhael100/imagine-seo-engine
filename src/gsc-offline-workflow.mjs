/**
 * SEO-F50 — single, strictly offline review path for an eventual Portal
 * integration. Operator-supplied inventories and responses are NEVER
 * authentication. No network calls or tokens.
 */
import {reviewOfflineGscPropertyPreflight,bindOfflineGscPlanToPreflight}
  from './gsc-property-preflight.mjs';
import {analyzeGscPaginatedResponses} from './gsc-pagination.mjs';

const INPUT=new Set(['tenantRef','requestedProperty','listedProperties','plan','pages']);
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(value));
const ownData=(object,allowed)=>Reflect.ownKeys(object).every(key=>
  typeof key==='string'&&allowed.has(key)&&
  Object.hasOwn(Object.getOwnPropertyDescriptor(object,key),'value'));

export function reviewOfflineGscReadiness(input={}){
  if(!plain(input)||!ownData(input,INPUT)||
    Reflect.ownKeys(input).length!==INPUT.size)
    throw Error('SEO GSC workflow: strict offline input required');
  const {tenantRef,requestedProperty,listedProperties,plan,pages}=input;
  const preflight=reviewOfflineGscPropertyPreflight({
    tenantRef,requestedProperty,listedProperties
  });
  const binding=bindOfflineGscPlanToPreflight({preflight,plan});
  // A failed declared listing blocks even local processing; neither outcome
  // indicates the operator actually owns the property.
  const canAnalyze=preflight.exactPropertyListed&&
    preflight.declaredReadPermissionEligible;
  const report=canAnalyze?analyzeGscPaginatedResponses(pages,plan):null;
  return {
    contractVersion:'seo-gsc-offline-workflow-v1',
    tenantRef:binding.tenantRef,
    propertyFingerprint:binding.propertyFingerprint,
    sourceType:'operator_supplied_not_verified',
    status:canAnalyze?'OFFLINE_REVIEW_ONLY':'DECLARED_PROPERTY_NOT_ELIGIBLE',
    pagination:report?{
      pagesReceived:report.pagination.pagesReceived,
      rowsReceived:report.pagination.rowsReceived,
      mayHaveMore:report.pagination.mayHaveMore,
      sourceMayBeTruncated:true
    }:null,
    summary:report?{
      inputRows:report.summary.inputRows,
      redactedRows:report.summary.redactedRows,
      analyzedRows:report.summary.analyzedRows,
      clicks:report.summary.clicks,
      impressions:report.summary.impressions
    }:null,
    oauthVerified:false,
    backendTenantGrantVerified:false,
    propertyConsentVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_BACKEND_VERIFICATION'
  };
}
