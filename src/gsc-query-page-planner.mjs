/**
 * SEO-F71 — Internal request blueprint for a later authenticated Portal
 * Search Analytics query,page connection. This function NEVER performs HTTP.
 * The local operator declaration is not OAuth, property access or RBAC.
 */
import {planGscQuery} from './gsc-readonly.mjs';

export function planOfflineGscQueryPage(input){
  // Reuse F10's strict property, tenant, reporting-period and field checks.
  // Do not accept arbitrary credentials or caller-supplied endpoint URLs.
  const queryPlan=planGscQuery(input);
  const rowLimit=queryPlan.body.rowLimit;
  const startRow=queryPlan.body.startRow;
  if(rowLimit>1000||startRow>3*rowLimit||startRow%rowLimit!==0)
    throw Error('SEO GSC query/page plan: bounded four-page offsets required');
  return {
    contractVersion:'seo-gsc-query-page-plan-offline-v1',
    tenantRef:queryPlan.tenantRef,
    propertyFingerprint:queryPlan.propertyFingerprint,
    method:'POST',
    url:queryPlan.url,
    requiredOAuthScope:queryPlan.requiredOAuthScope,
    authorization:'operator_declared_provider_verification_pending',
    body:Object.freeze({
      ...queryPlan.body,
      dimensions:Object.freeze(['query','page']),
      aggregationType:'byPage'
    }),
    sourceType:'offline_request_blueprint_only',
    oauthVerified:false,
    propertyAccessVerified:false,
    tenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_AUTHENTICATED_PORTAL_INTEGRATION'
  };
}
