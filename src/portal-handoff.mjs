/**
 * SEO-F24 — handoff envelope for the future authenticated Imagine Portal.
 * It cannot create permissions: this is a deliberately NON-PUBLISHABLE,
 * unverified local contract. No input data is forwarded wholesale.
 */
const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const FINGERPRINT=/^[0-9a-f]{64}$/;
const SHA=/^[0-9a-f]{40}$/;
const COUNTS_MAX=1000000;
const ACTIONS=new Set([
 'review_indexation','repair_canonical','fix_sitemap','review_robots',
 'repair_internal_links','improve_internal_navigation','review_page_metadata',
 'review_page_structure','review_structured_data','review_other_technical_findings',
 'review_impression_drop','review_click_drop','review_ctr_drop',
 'review_average_position','review_new_search_theme'
]);
const STATUSES=new Set(['review_required','attention','no_findings_in_supplied_audit']);
const PRIORITIES=new Set(['critical','high','medium','low']);
const count=(v,max=COUNTS_MAX)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
function boundedCounts(source,label){
  if(!source||typeof source!=='object'||Array.isArray(source)||
    !count(source.clicks)||!count(source.impressions)||
    source.clicks>source.impressions)throw Error('SEO Portal handoff: invalid '+label+' metrics');
  return {clicks:source.clicks,impressions:source.impressions};
}
const fraction=(before,after)=>before>0?Math.round((after-before)/before*1000)/1000:null;

export function preparePortalSeoHandoff({tenantRef,propertyFingerprint,sourceRevision,brief}={}){
  if(typeof tenantRef!=='string'||!TENANT.test(tenantRef)||
    typeof propertyFingerprint!=='string'||!FINGERPRINT.test(propertyFingerprint)||
    typeof sourceRevision!=='string'||!SHA.test(sourceRevision))
    throw Error('SEO Portal handoff: invalid offline scope or revision');
  if(!brief||typeof brief!=='object'||Array.isArray(brief)||
    brief.contractVersion!=='seo-brief-offline-v1'||
    brief.sourceType!=='operator_supplied_offline_reports_unverified'||
    !brief.technical||!Array.isArray(brief.recommendedReviews)||
    brief.recommendedReviews.length>32)
    throw Error('SEO Portal handoff: compatible brief required');
  const t=brief.technical;
  if(!STATUSES.has(t.status)||!count(t.pages,20000)||
    !count(t.errors)||!count(t.warnings)||
    (t.errors>0&&t.status!=='review_required')||
    (t.errors===0&&t.warnings>0&&t.status!=='attention')||
    (t.errors===0&&t.warnings===0&&t.status!=='no_findings_in_supplied_audit'))
    throw Error('SEO Portal handoff: inconsistent technical summary');
  const reviews=brief.recommendedReviews.map(review=>{
    if(!review||typeof review!=='object'||Array.isArray(review)||
      !ACTIONS.has(review.code)||!PRIORITIES.has(review.priority)||
      !count(review.count)||review.count<1)
      throw Error('SEO Portal handoff: unrecognized review entry');
    return {code:review.code,priority:review.priority,count:review.count};
  });
  const keySeen=new Set();
  for(const review of reviews){
    if(keySeen.has(review.code))
      throw Error('SEO Portal handoff: duplicate review entry');
    keySeen.add(review.code);
  }
  let organic=null;
  if(brief.organic!==null && brief.organic!==undefined){
    const g=brief.organic;
    if(!g||typeof g!=='object'||Array.isArray(g)||!count(g.days,92)||g.days===0)
      throw Error('SEO Portal handoff: invalid organic summary');
    const previous=boundedCounts(g.previous,'previous');
    const current=boundedCounts(g.current,'current');
    organic={
      days:g.days,previous,current,
      clicksChangeFraction:fraction(previous.clicks,current.clicks),
      impressionsChangeFraction:fraction(previous.impressions,current.impressions)
    };
  }
  return {
    contractVersion:'seo-portal-review-handoff-v1',
    origin:'offline_unverified_not_for_customer_display',
    scope:{tenantRef,propertyFingerprint,sourceRevision},
    releaseStatus:'HOLD_EXTERNAL_AUTHORIZATION',
    customerDisplayAuthorized:false,
    propertyAuthorizationVerified:false,
    backendTenantGrantVerified:false,
    publicationAuthorized:false,
    technical:{status:t.status,pages:t.pages,errors:t.errors,warnings:t.warnings},
    organic,
    suggestedReviews:reviews,
    requirements:[
      'A trusted Portal backend must independently authenticate the user and verify the tenant grant.',
      'Google Search Console property access and consent must be proven before customer display.',
      'This offline envelope is neither a bearer token nor evidence of a verified data source.'
    ]
  };
}
