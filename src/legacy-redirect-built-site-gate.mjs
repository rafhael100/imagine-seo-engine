/**
 * SEO F128 — check F127's legacy redirect plan against the *actual*
 * compiled local static site, instead of trusting an operator target list.
 * Pure read-only CI review, no DNS/HTTP requests or 301 rule installation.
 */
import {auditStaticSite} from './audit-static.mjs';
import {reviewLegacyOriginAndLocaleRedirects}
  from './legacy-origin-locale-redirect-review.mjs';

const MAX_MISSING=200,MAX_ROUTES=20000;
function exact(value,fields){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const own=Reflect.ownKeys(value);
  return own.length===fields.length&&own.every(key=>{
    if(typeof key!=='string'||!fields.includes(key))return false;
    const d=Object.getOwnPropertyDescriptor(value,key);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
export async function reviewCompiledLegacyRedirectTargets(input){
  if(!exact(input,['planInput','buildDirectory'])||
     typeof input.buildDirectory!=='string'||
     input.buildDirectory.length<1||input.buildDirectory.length>2048)
    throw Error('SEO F128: invalid real build review input');
  // Validates exact plan schema before awaiting filesystem operations.
  const plan=reviewLegacyOriginAndLocaleRedirects(input.planInput);
  const pinnedRoutes=[...input.planInput.targetRoutes];
  if(pinnedRoutes.length>MAX_ROUTES)
    throw Error('SEO F128: too many target routes');
  const result=await auditStaticSite(input.buildDirectory,{
    siteUrl:input.planInput.canonicalOrigin,
    strictPublicHead:true,
    allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
    checkHreflang:true
  });
  if(result.routes.length!==result.summary.pages)
    throw Error('SEO F128: inconsistent audited page list');
  const actual=new Set(result.routes);
  const missingIndices=[];
  let missingTargetRoutes=0;
  for(let i=0;i<pinnedRoutes.length;i++){
    if(!actual.has(pinnedRoutes[i])){
      missingTargetRoutes++;
      if(missingIndices.length<MAX_MISSING)missingIndices.push(i);
    }
  }
  const sitemapOmissions=result.warnings.filter(
    e=>e.type==='page_not_in_sitemap').length;
  const blocked=plan.reviewStatus==='blocked'||
    missingTargetRoutes>0||result.summary.errors>0||sitemapOmissions>0;
  return {
    contractVersion:'seo-f128-legacy-redirect-compiled-html-review-v1',
    reviewStatus:blocked?'blocked':'human_independent_redirect_review_required',
    planStatus:plan.reviewStatus,
    summary:{
      legacyUrlCount:plan.summary.legacyUrlCount,
      explicitlyMapped301s:plan.summary.reviewed301Candidates,
      unmappedLegacyUrls:plan.summary.unmappedCount,
      localeMismatchCount:plan.summary.localeMismatchCount,
      aliasReviewCount:plan.summary.legacyEnglishAliasReviewCount,
      declaredTargetRoutes:pinnedRoutes.length,
      auditedRealBuildPages:result.summary.pages,
      missingTargetRoutes,
      omittedMissingRouteIndices:missingTargetRoutes-missingIndices.length,
      staticHtmlErrors:result.summary.errors,
      staticHtmlWarnings:result.summary.warnings,
      pagesNotInSitemap:sitemapOmissions
    },
    missingRouteIndices:missingIndices,
    htmlActuallyAudited:true,
    originalSiteHttpStatusesVerified:false,
    legacyContentEquivalenceVerified:false,
    realSearchConsoleImported:false,
    productionRedirectsApplied:0,
    publicationAuthorized:false,
    redirectDeploymentAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_REDIRECT_EQUIVALENCE_STAGING_BACKUP_AND_INDEPENDENT_APPROVAL'
  };
}
