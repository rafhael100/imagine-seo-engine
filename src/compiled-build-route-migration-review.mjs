/**
 * F169 — enforce a real compiled-site F22 migration review.
 * No deployed redirects, URL output, HTTP calls or release authority.
 */
import {auditStaticSite} from './audit-static.mjs';
import {reviewStaticRouteMigration} from './redirect-review.mjs';
const keys=['beforeDirectory','afterDirectory','candidates'];
const exact=(x)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 [Object.prototype,null].includes(Object.getPrototypeOf(x))&&
 Reflect.ownKeys(x).length===keys.length&&keys.every(k=>
  Object.hasOwn(x,k)&&Object.getOwnPropertyDescriptor(x,k)?.enumerable===true);
export async function reviewTwoCompiledSiteMigration(input){
 if(!exact(input)||typeof input.beforeDirectory!=='string'||
  typeof input.afterDirectory!=='string'||input.beforeDirectory.length<1||
  input.afterDirectory.length<1||input.beforeDirectory.length>2048||
  input.afterDirectory.length>2048||!Array.isArray(input.candidates))
  throw Error('F169: two real builds and bounded operator candidates required');
 const config={
  strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
 };
 const before=await auditStaticSite(input.beforeDirectory,config);
 const after=await auditStaticSite(input.afterDirectory,config);
 const migration=reviewStaticRouteMigration({
  before,after,candidates:input.candidates
 });
 const auditErrors=before.summary.errors+after.summary.errors;
 const auditWarnings=before.summary.warnings+after.summary.warnings;
 const needsReview=migration.removedCount>0||auditErrors>0||auditWarnings>0;
 return Object.freeze({
  contractVersion:'seo-f169-compiled-route-migration-review-v1',
  compiledHtmlActuallyAudited:true,
  beforePages:before.summary.pages,
  afterPages:after.summary.pages,
  removedRoutes:migration.removedCount,
  addedRoutes:migration.addedCount,
  reviewed301Candidates:migration.candidateCount,
  unmappedRemovedRoutes:migration.unmappedCount,
  staticHtmlErrors:auditErrors,
  staticHtmlWarnings:auditWarnings,
  structuralMigrationReviewRequired:needsReview,
  originalUrlsStatusVerified:false,
  editorialContentEquivalenceVerified:false,
  liveRedirectsInstalled:0,
  independentReviewRequired:true,
  publicationAuthorized:false,
  deploymentAuthorized:false,
  indexingAuthorized:false,
  networkPerformed:false,
  releaseStatus:needsReview?'HOLD_ROUTE_LOSS_OR_TECHNICAL_REVIEW':'HOLD_INDEPENDENT_REDIRECT_STAGING_AND_EDITORIAL_REVIEW'
 });
}
