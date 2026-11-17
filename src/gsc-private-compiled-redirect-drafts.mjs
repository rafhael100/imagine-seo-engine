/**
 * SEO F185 — conservative PRIVATE 301 draft generator from original,
 * operator-supplied GSC PAGE rows and independently audited build routes.
 *
 * Sensitive URLs exist ONLY in the privateManifest return member and must
 * never be logged, stored in Git or forwarded to a customer dashboard.
 */
import {reviewOfflineGscPageOrigins}
 from './gsc-page-origin-parity.mjs';
import {reviewLegacyOriginAndLocaleRedirects}
 from './legacy-origin-locale-redirect-review.mjs';
import {prioritizeOfflineGscLegacyMigration}
 from './gsc-legacy-migration-priority.mjs';

const FIELDS=['gscPageInput','targetRoutes'];
function exact(x,keys){
 if(x===null||typeof x!=='object'||Array.isArray(x)||
   ![Object.prototype,null].includes(Object.getPrototypeOf(x))||
   Reflect.ownKeys(x).length!==keys.length)return false;
 return keys.every(k=>{
  const d=Object.getOwnPropertyDescriptor(x,k);
  return d?.enumerable===true&&Object.hasOwn(d,'value');
 });
}
const sensitive=Object.freeze({
  propertyOAuthVerified:false,tenantGrantVerified:false,
  liveHttpRedirectsVerified:false,contentEquivalenceReviewed:false,
  productionRulesInstalled:0,publicationAuthorized:false,
  deploymentAuthorized:false,indexingAuthorized:false,
  networkPerformed:false
});
export function proposePrivateGscBuildRedirects(input){
 if(!exact(input,FIELDS))
  throw Error('F185: original GSC and audited route inventory required');
 const pageReport=reviewOfflineGscPageOrigins(input.gscPageInput);
 const property=input.gscPageInput.property;
 const domain=property.startsWith('sc-domain:')?
  property.slice('sc-domain:'.length):'';
 const canonical='https://'+domain+'/';
 if(!domain||domain!==domain.toLowerCase()||
   input.gscPageInput.canonicalOrigin!==canonical)
  throw Error('F185: canonical domain-only property must match');
 // Validate a complete/unique local target route set before touching pages.
 const preliminary={
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:domain,canonicalOrigin:canonical,
  legacyUrls:[],targetRoutes:input.targetRoutes,candidates:[]
 };
 reviewLegacyOriginAndLocaleRedirects(preliminary);
 const routeSet=new Set(input.targetRoutes);
 const out={
  contractVersion:'seo-f185-private-gsc-build-301-drafts-v1',
  providerSourceType:'operator_supplied_gsc_pages_unverified',
  observedPageRows:pageReport.summary.receivedRows,
  redactedRows:pageReport.summary.redactedRows,
  paginationIncomplete:input.gscPageInput.hasMore,
  auditedLocalTargetRoutes:routeSet.size,
  proposedHostSchemeOnly301s:null,
  unresolvedLegacyRows:null,
  unscopedSubdomainRows:null,
  unsafeRouteRows:null,
  historicalLocaleAliasRows:null,
  sourceReviewStatus:null,
  prioritizedReviewIndices:null,
  metricsWithheld:pageReport.summary.redactedRows>0,
  ...sensitive,
  releaseStatus:'HOLD_PRIVATE_301_EQUIVALENCE_HTTP_AND_BACKEND_GSC_AUTHORIZATION'
 };
 // F193: never create a candidate redirect manifest from an incomplete
 // PAGE export. The partially observed URLs cannot prove migration coverage.
 if(out.metricsWithheld||out.paginationIncomplete)
  return Object.freeze({privateManifest:null,publicReport:Object.freeze(out)});
 const legacyUrls=[],candidates=[];
 let other=0,unsafe=0,aliases=0;
 for(const row of input.gscPageInput.rows){
  const url=new URL(row.keys[0]);
  if(![domain,'www.'+domain].includes(url.hostname)){other++;continue;}
  // The F127 contract forbids encoded / questionable routes. Do not
  // silently decode, rewrite or turn them into accidental 301 rules.
  const path=url.pathname;
  if(path.length>512||path.startsWith('//')||path.includes('//')||
    /[?#%\\\x00-\x1f\x7f]/.test(path)||
    path.split('/').some(p=>p==='.'||p==='..')){
   unsafe++;continue;
  }
  const isCanonical=row.keys[0]==='https://'+domain+path;
  if(isCanonical&&routeSet.has(path))continue;
  legacyUrls.push(row.keys[0]);
  const isLegacyLocale=path==='/en-us'||path.startsWith('/en-us/')||
    path==='/es-es'||path.startsWith('/es-es/');
  if(isLegacyLocale){aliases++;continue;}
  if(routeSet.has(path) && !isCanonical)
   candidates.push({fromUrl:row.keys[0],toPath:path,status:301});
 }
 const manifest={
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:domain,canonicalOrigin:canonical,
  legacyUrls,targetRoutes:[...input.targetRoutes],candidates
 };
 const validated=reviewLegacyOriginAndLocaleRedirects(manifest);
 const priority=prioritizeOfflineGscLegacyMigration({
  gscPageInput:input.gscPageInput,legacyMigrationInput:manifest
 });
 out.proposedHostSchemeOnly301s=candidates.length;
 out.unresolvedLegacyRows=validated.summary.unmappedCount;
 out.unscopedSubdomainRows=other;
 out.unsafeRouteRows=unsafe;
 out.historicalLocaleAliasRows=aliases;
 out.sourceReviewStatus=validated.reviewStatus;
 out.prioritizedReviewIndices=priority.prioritizedReviewIndices;
 return Object.freeze({
  // Do not serialize this value in logs or public API responses.
  privateManifest:manifest,
  publicReport:Object.freeze(out)
 });
}
