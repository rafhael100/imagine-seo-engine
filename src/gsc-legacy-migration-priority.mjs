/**
 * SEO F183: prioritize independently supplied GSC PAGE evidence for manual
 * HTTP/www/locale migration reviews. No URL, query, tenant, token or private
 * property is returned or logged. No network or redirect mutations.
 */
import {reviewOfflineGscLegacyMigrationCoverage}
  from './gsc-legacy-redirect-coverage.mjs';

const MAX_PRIORITY=25;
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const sum=(a,b)=>{
  const total=a+b;
  if(!Number.isSafeInteger(total))
    throw Error('SEO F183: unsafe aggregated metrics');
  return total;
};
const metric=()=>({rows:0,clicks:0,impressions:0});
function add(target,row){
  target.rows++;
  target.clicks=sum(target.clicks,row.clicks);
  target.impressions=sum(target.impressions,row.impressions);
}
const buckets=[
  'already_canonical','mapped_legacy_review',
  'unmapped_legacy_review','unlisted_noncanonical_review',
  'other_subdomain_scope_review'
];
export function prioritizeOfflineGscLegacyMigration(input){
  // F133 recomputes F131 provider-shaped PAGE validation + F127 redirect
  // inventory; never trust a caller-supplied summary, report or priority.
  const verified=reviewOfflineGscLegacyMigrationCoverage(input);
  const original=input.gscPageInput;
  const migration=input.legacyMigrationInput;
  const result={
    contractVersion:'seo-f183-original-gsc-page-migration-priority-v1',
    sourceType:'operator_supplied_gsc_pages_and_301_candidates_unverified',
    reviewStatus:'HOLD_HUMAN_REDIRECT_AND_BACKEND_GSC_AUTHORIZATION',
    sourceRows:verified.summary.suppliedGscPageRows,
    redactedRows:verified.summary.redactedGscPageRows,
    paginationIncomplete:original.hasMore,
    originalRedirectManifestReviewStatus:verified.originalRedirectReviewStatus,
    buckets:null,
    atRiskPageRows:null,
    atRiskClicks:null,
    atRiskImpressions:null,
    prioritizedReviewIndices:null,
    omittedPriorityCount:null,
    metricsWithheld:verified.summary.redactedGscPageRows>0,
    providerOAuthVerified:false,
    portalTenantGrantVerified:false,
    liveRedirectHttpVerified:false,
    redirectContentEquivalenceVerified:false,
    completeSearchConsoleCoverageVerified:false,
    deploymentAuthorized:false,
    publicationAuthorized:false,
    indexingAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_GSC_OAUTH_REDIRECT_STAGING_AND_HUMAN_REVIEW'
  };
  // The F131 privacy rule WITHHOLDS ALL metrics if even one private URL
  // variant contains query/hash, not merely the offending row.
  if(result.metricsWithheld)return Object.freeze(result);
  const domain=migration.siteDomain;
  const canonical='https://'+domain;
  const known=new Set(migration.legacyUrls);
  const mapped=new Set(migration.candidates.map(x=>x.fromUrl));
  const destinations=new Set(migration.targetRoutes);
  const grouped=Object.fromEntries(buckets.map(key=>[key,metric()]));
  const priority=[];
  for(let i=0;i<original.rows.length;i++){
    const row=original.rows[i];
    // Validation already performed by F131 and F127. In this scope,
    // the only user-defined properties accessed are validated own data.
    const url=new URL(row.keys[0]);
    let category;
    if(url.hostname!==domain&&url.hostname!=='www.'+domain){
      category='other_subdomain_scope_review';
    }else if(row.keys[0]===canonical+url.pathname&&
      destinations.has(url.pathname)){
      category='already_canonical';
    }else if(known.has(row.keys[0])&&mapped.has(row.keys[0])){
      category='mapped_legacy_review';
    }else if(known.has(row.keys[0])){
      category='unmapped_legacy_review';
    }else {
      category='unlisted_noncanonical_review';
    }
    add(grouped[category],row);
    if(!['already_canonical','mapped_legacy_review'].includes(category)){
      priority.push({
        sourceRowIndex:i,reasonCode:category,
        impressions:row.impressions,clicks:row.clicks
      });
    }
  }
  // Rank risk without ever emitting original URLs. "0 impressions" still
  // requires mapping review, and a covered 301 is not validated via HTTP.
  priority.sort((a,b)=>b.impressions-a.impressions||
    b.clicks-a.clicks||a.sourceRowIndex-b.sourceRowIndex);
  const risk=metric();
  for(const key of [
    'unmapped_legacy_review','unlisted_noncanonical_review',
    'other_subdomain_scope_review'
  ]){
    risk.rows+=grouped[key].rows;
    risk.clicks=sum(risk.clicks,grouped[key].clicks);
    risk.impressions=sum(risk.impressions,grouped[key].impressions);
  }
  result.buckets=Object.freeze(Object.fromEntries(buckets.map(
    key=>[key,Object.freeze(grouped[key])]
  )));
  result.atRiskPageRows=risk.rows;
  result.atRiskClicks=risk.clicks;
  result.atRiskImpressions=risk.impressions;
  result.prioritizedReviewIndices=Object.freeze(priority.slice(0,MAX_PRIORITY)
    .map(x=>Object.freeze(x)));
  result.omittedPriorityCount=priority.length-result.prioritizedReviewIndices.length;
  return Object.freeze(result);
}
