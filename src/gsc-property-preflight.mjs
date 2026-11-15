/**
 * SEO-F39 — property list preflight for a future authenticated GSC reader.
 * The list is operator-supplied, not authenticated. This function NEVER
 * grants permission, reads Google, or forwards raw properties in its result.
 */
import {createHash} from 'node:crypto';
import {canonicalProperty,validateOfflineGscQueryPlan} from './gsc-readonly.mjs';
import {validateGscPeriod} from './gsc-period.mjs';

const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const VALID_LEVELS=new Set([
  'siteOwner','siteFullUser','siteRestrictedUser','siteUnverifiedUser'
]);
const READ_LEVELS=new Set([
  'siteOwner','siteFullUser','siteRestrictedUser'
]);
const fingerprint=value=>createHash('sha256').update(value,'utf8').digest('hex');
const QUERY_FIELDS=new Set([
  'startDate','endDate','dimensions','type','aggregationType',
  'dataState','rowLimit','startRow'
]);
const PLAN_FIELDS=new Set([
  'contractVersion','tenantRef','propertyFingerprint','requiredOAuthScope',
  'authorization','method','url','body','networkPerformed'
]);
const exactFields=(record,fields)=>
  record&&typeof record==='object'&&!Array.isArray(record)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(record))&&
  Reflect.ownKeys(record).length===fields.size&&
  Reflect.ownKeys(record).every(key=>
    typeof key==='string'&&fields.has(key)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(record,key),'value'));

export function reviewOfflineGscPropertyPreflight({
  tenantRef,requestedProperty,listedProperties
}={}){
  if(typeof tenantRef!=='string'||!TENANT.test(tenantRef))
    throw Error('SEO GSC preflight: invalid tenant reference');
  const canonical=canonicalProperty(requestedProperty);
  if(!Array.isArray(listedProperties)||listedProperties.length>100)
    throw Error('SEO GSC preflight: bounded property listing required');

  let matchedLevel=null;
  const seen=new Set();
  for(const entry of listedProperties){
    if(!entry||typeof entry!=='object'||Array.isArray(entry)||
      !exactFields(entry,new Set(['siteUrl','permissionLevel']))||
      typeof entry.siteUrl!=='string'||!VALID_LEVELS.has(entry.permissionLevel))
      throw Error('SEO GSC preflight: malformed property listing');
    const property=canonicalProperty(entry.siteUrl);
    if(seen.has(property))
      throw Error('SEO GSC preflight: duplicate property in listing');
    seen.add(property);
    if(property===canonical)matchedLevel=entry.permissionLevel;
  }
  const listed=matchedLevel!==null;
  const eligible=READ_LEVELS.has(matchedLevel);
  return {
    contractVersion:'seo-gsc-property-preflight-offline-v1',
    sourceType:'operator_supplied_sites_list_not_verified',
    tenantRef,
    propertyFingerprint:fingerprint(canonical),
    propertiesInspected:listedProperties.length,
    exactPropertyListed:listed,
    declaredReadPermissionEligible:eligible,
    status:!listed?'PROPERTY_NOT_LISTED':
      eligible?'DECLARED_READ_ACCESS_NOT_VERIFIED':'INSUFFICIENT_DECLARED_PERMISSION',
    oauthVerified:false,
    portalTenantGrantVerified:false,
    propertyConsentVerified:false,
    productionReadAuthorized:false,
    authorization:'HOLD_BACKEND_OAUTH_AND_TENANT_VERIFICATION',
    caveats:[
      'Exact property identifiers must match; a domain property is not inferred from an URL-prefix property or vice versa.',
      'The supplied site list is untrusted until a backend validates Google OAuth, property permissions, consent and the tenant grant.',
      'This is not evidence of ownership, connected Google credentials or a real Google API response.'
    ]
  };
}

/**
 * SEO-F40 — Bind a read-only query plan to the exact synthetic preflight
 * fingerprint and tenant. The result is never authorization.
 */
export function bindOfflineGscPlanToPreflight({preflight,plan}={}){
  if(!preflight||typeof preflight!=='object'||Array.isArray(preflight)||
    preflight.contractVersion!=='seo-gsc-property-preflight-offline-v1'||
    preflight.sourceType!=='operator_supplied_sites_list_not_verified'||
    typeof preflight.tenantRef!=='string'||!TENANT.test(preflight.tenantRef)||
    typeof preflight.propertyFingerprint!=='string'||
    !/^[0-9a-f]{64}$/.test(preflight.propertyFingerprint)||
    preflight.authorization!=='HOLD_BACKEND_OAUTH_AND_TENANT_VERIFICATION'||
    preflight.oauthVerified!==false||
    preflight.portalTenantGrantVerified!==false||
    preflight.propertyConsentVerified!==false||
    preflight.productionReadAuthorized!==false||
    typeof preflight.exactPropertyListed!=='boolean'||
    typeof preflight.declaredReadPermissionEligible!=='boolean'||
    !Number.isSafeInteger(preflight.propertiesInspected)||
    preflight.propertiesInspected<0||preflight.propertiesInspected>100||
    (preflight.exactPropertyListed&&preflight.propertiesInspected===0))
    throw Error('SEO GSC binding: valid offline preflight required');
  const status=!preflight.exactPropertyListed?'PROPERTY_NOT_LISTED':
    preflight.declaredReadPermissionEligible?
      'DECLARED_READ_ACCESS_NOT_VERIFIED':'INSUFFICIENT_DECLARED_PERMISSION';
  if(status!==preflight.status||
    (preflight.declaredReadPermissionEligible&&!preflight.exactPropertyListed))
    throw Error('SEO GSC binding: inconsistent property preflight');
  if(!plan||typeof plan!=='object'||Array.isArray(plan)||
    !exactFields(plan,PLAN_FIELDS)||
    plan.contractVersion!=='seo-gsc-readonly-plan-v1'||
    plan.tenantRef!==preflight.tenantRef||
    plan.propertyFingerprint!==preflight.propertyFingerprint||
    plan.method!=='POST'||plan.networkPerformed!==false||
    plan.authorization!=='operator_declared_provider_verification_pending'||
    plan.requiredOAuthScope!=='https://www.googleapis.com/auth/webmasters.readonly')
    throw Error('SEO GSC binding: incompatible query plan or tenant');
  // Pin the actual Google URL path too, not only the claimed fingerprint.
  // A tampered URL is otherwise able to point the future HTTP client at
  // another site while the fingerprint remains unchanged.
  if(typeof plan.url!=='string'||plan.url.length>4096)
    throw Error('SEO GSC binding: invalid query URL');
  const match=plan.url.match(/^https:\/\/www\.googleapis\.com\/webmasters\/v3\/sites\/([^/?#]+)\/searchAnalytics\/query$/);
  if(!match)throw Error('SEO GSC binding: invalid query URL');
  let property;
  try{property=canonicalProperty(decodeURIComponent(match[1]));}
  catch{throw Error('SEO GSC binding: invalid query URL');}
  if(fingerprint(property)!==plan.propertyFingerprint||
    encodeURIComponent(property)!==match[1])
    throw Error('SEO GSC binding: property and query URL mismatch');
  if(!exactFields(plan.body,QUERY_FIELDS)||
    plan.body.type!=='web'||plan.body.dataState!=='final'||
    plan.body.aggregationType!=='byProperty'||
    !Array.isArray(plan.body.dimensions)||
    plan.body.dimensions.length!==1||plan.body.dimensions[0]!=='query'||
    !Number.isSafeInteger(plan.body.rowLimit)||
    plan.body.rowLimit<1||plan.body.rowLimit>25000||
    !Number.isSafeInteger(plan.body.startRow)||plan.body.startRow<0||
    plan.body.startRow>100000)
    throw Error('SEO GSC binding: unsupported query body');
  try {
    validateGscPeriod(plan.body.startDate,plan.body.endDate);
  } catch {
    throw Error('SEO GSC binding: unsupported query period');
  }
  // Keep existing specific validation failures and run the shared strict
  // validator before accepting a plan, so callers cannot bypass F41 rules.
  try { validateOfflineGscQueryPlan(plan); }
  catch { throw Error('SEO GSC binding: incompatible query plan'); }
  return {
    contractVersion:'seo-gsc-offline-bound-plan-v1',
    tenantRef:preflight.tenantRef,
    propertyFingerprint:preflight.propertyFingerprint,
    exactPropertyListed:preflight.exactPropertyListed,
    declaredReadPermissionEligible:preflight.declaredReadPermissionEligible,
    scopeIntegrityCheckedOffline:true,
    oauthVerified:false,
    tenantGrantVerified:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    authorization:'HOLD_EXTERNAL_BACKEND_VERIFICATION'
  };
}
