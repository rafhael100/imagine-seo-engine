/**
 * SEO F133 — join original GSC PAGE signals to F127's operator-reviewed
 * legacy 301 inventory without leaking a single URL or query.
 *
 * An observed old URL with no covered migration candidate is a release hold.
 * This does NOT prove a Google page is indexed or an HTTP redirect exists.
 */
import {reviewOfflineGscPageOrigins} from './gsc-page-origin-parity.mjs';
import {reviewLegacyOriginAndLocaleRedirects} from
  './legacy-origin-locale-redirect-review.mjs';

const LIMIT=200;
function exact(value,fields){
  if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(value,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
export function reviewOfflineGscLegacyMigrationCoverage(input){
  if(!exact(input,['gscPageInput','legacyMigrationInput']))
    throw Error('SEO F133: expected exact independent GSC and legacy evidence');
  const gsc=reviewOfflineGscPageOrigins(input.gscPageInput);
  const redirects=reviewLegacyOriginAndLocaleRedirects(input.legacyMigrationInput);
  const {gscPageInput:g,legacyMigrationInput:m}=input;
  // Verify both data sources belong to the SAME declared domain and origin;
  // never combine page evidence from a different tenant/domain.
  if(g.property!=='sc-domain:'+m.siteDomain||
     g.canonicalOrigin!==m.canonicalOrigin)
    throw Error('SEO F133: property/redirect origin mismatch');

  const redacted=g.summary.redactedRows>0;
  const summary={
    suppliedGscPageRows:g.summary.receivedRows,
    redactedGscPageRows:g.summary.redactedRows,
    reviewedLegacyUrlRows:redirects.summary.legacyUrlCount,
    originalRedirectCandidateCount:redirects.summary.reviewed301Candidates,
    originalRedirectUnmappedCount:redirects.summary.unmappedCount,
    originalLocaleMismatchCount:redirects.summary.localeMismatchCount,
    alreadyCanonicalGscPageRows:null,
    coveredLegacyGscPageRows:null,
    uncoveredLegacyGscPageRows:null,
    otherSubdomainGscPageRows:null,
    omittedUncoveredIndices:null
  };
  const uncoveredGscIndices=[];
  let status='blocked';
  const signals=[];
  if(redacted){
    signals.push('withhold_all_coverage_due_to_private_url_variants');
  }else{
    const supportedHosts=new Set([m.siteDomain,'www.'+m.siteDomain]);
    const canonicalSite='https://'+m.siteDomain;
    const destinationSet=new Set(m.targetRoutes);
    const oldSet=new Set(m.legacyUrls);
    const mapped=new Set(m.candidates.map(c=>c.fromUrl));
    let canonicalCount=0,coveredCount=0,uncoveredCount=0,otherCount=0;
    for(let i=0;i<g.rows.length;i++){
      const value=g.rows[i].keys[0];
      // F131 has already checked the URL, the provider domain, strict
      // cardinality and absence of URL parameters/fragment when unredacted.
      const url=new URL(value);
      if(!supportedHosts.has(url.hostname)){
        otherCount++;continue;
      }
      const canonical=value===canonicalSite+url.pathname&&
        destinationSet.has(url.pathname);
      if(canonical){canonicalCount++;continue;}
      if(oldSet.has(value)&&mapped.has(value)){coveredCount++;continue;}
      uncoveredCount++;
      if(uncoveredGscIndices.length<LIMIT)uncoveredGscIndices.push(i);
    }
    Object.assign(summary,{
      alreadyCanonicalGscPageRows:canonicalCount,
      coveredLegacyGscPageRows:coveredCount,
      uncoveredLegacyGscPageRows:uncoveredCount,
      otherSubdomainGscPageRows:otherCount,
      omittedUncoveredIndices:uncoveredCount-uncoveredGscIndices.length
    });
    if(uncoveredCount)signals.push('review_observed_legacy_urls_without_redirect_mapping');
    if(otherCount)signals.push('review_unscoped_gsc_subdomain_origins');
    if(redirects.reviewStatus==='blocked')
      signals.push('review_invalid_legacy_redirect_manifest');
    if(g.hasMore)signals.push('review_remaining_gsc_page_pagination');
    if(!signals.length)status='human_independent_redirect_review_required';
  }
  return {
    contractVersion:'seo-f133-gsc-legacy-redirect-coverage-offline-v1',
    sourceType:'independent_operator_supplied_gsc_and_migration_unverified',
    reviewStatus:status,
    summary,uncoveredGscIndices,reviewSignals:signals,
    coverageStatus:g.coverageStatus,
    originalRedirectReviewStatus:redirects.reviewStatus,
    propertyAuthenticated:false,
    originalGoogleSearchDataVerified:false,
    existingLiveHttp301Verified:false,
    allLegacyUrlsDiscovered:false,
    redirectEquivalenceEditoriallyApproved:false,
    redirectDeploymentAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_GOOGLE_SCOPE_CONTENT_EQUIVALENCE_AND_HTTP_STAGING'
  };
}
