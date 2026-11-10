/**
 * SEO-F39 — property list preflight for a future authenticated GSC reader.
 * The list is operator-supplied, not authenticated. This function NEVER
 * grants permission, reads Google, or forwards raw properties in its result.
 */
import {createHash} from 'node:crypto';
import {canonicalProperty} from './gsc-readonly.mjs';

const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const VALID_LEVELS=new Set([
  'siteOwner','siteFullUser','siteRestrictedUser','siteUnverifiedUser'
]);
const READ_LEVELS=new Set([
  'siteOwner','siteFullUser','siteRestrictedUser'
]);
const fingerprint=value=>createHash('sha256').update(value,'utf8').digest('hex');

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
