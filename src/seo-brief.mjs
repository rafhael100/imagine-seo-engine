/**
 * SEO-F17 — executive report for future Portal rendering, local and offline.
 * Only emits approved categories and aggregate numbers; discards free text,
 * raw queries, per-file names and property URLs from untrusted input.
 */
const ISSUE_ACTIONS=Object.freeze({
  unexpected_noindex:['critical','review_indexation'],
  unexpected_nofollow:['high','review_indexation'],
  googlebot_indexing_blocked:['critical','review_indexation'],
  duplicate_googlebot_meta:['high','review_indexation'],
  wrong_canonical:['critical','repair_canonical'],
  missing_canonical:['high','repair_canonical'],
  duplicate_canonical:['high','repair_canonical'],
  invalid_sitemap_url:['high','fix_sitemap'],
  missing_sitemap:['high','fix_sitemap'],
  invalid_sitemap_structure:['high','fix_sitemap'],
  missing_sitemap_urls:['high','fix_sitemap'],
  robots_block_all:['critical','review_robots'],
  missing_robots:['high','review_robots'],
  broken_internal_link:['high','repair_internal_links'],
  orphan_page:['medium','improve_internal_navigation'],
  unreachable_page:['medium','improve_internal_navigation'],
  deep_page:['medium','improve_internal_navigation'],
  missing_title:['high','review_page_metadata'],
  duplicate_title:['medium','review_page_metadata'],
  missing_description:['medium','review_page_metadata'],
  missing_robots_meta:['high','review_indexation'],
  wrong_robots_meta:['critical','review_indexation'],
  missing_og_url:['medium','review_page_metadata'],
  wrong_og_url:['high','review_page_metadata'],
  heading_count:['medium','review_page_structure'],
  unsafe_href:['high','repair_internal_links'],
  invalid_internal_link:['high','repair_internal_links'],
  invalid_jsonld:['medium','review_structured_data'],
  missing_jsonld:['low','review_structured_data']
});
const SIGNAL_ACTIONS=Object.freeze({
  investigate_impressions_drop:'review_impression_drop',
  investigate_clicks_drop:'review_click_drop',
  investigate_ctr_drop:'review_ctr_drop',
  investigate_average_position_decline:'review_average_position',
  new_visible_cluster:'review_new_search_theme'
});
const PRIORITY={critical:0,high:1,medium:2,low:3};
const validCount=(v,max=1000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const delta=(before,after)=>before>0?Math.round(((after-before)/before)*1000)/1000:null;
function technicalReport(audit){
  if(!audit||typeof audit!=='object'||Array.isArray(audit)||
    !audit.summary||!Array.isArray(audit.errors)||!Array.isArray(audit.warnings))
    throw Error('SEO brief: valid audit required');
  const {pages,errors,warnings}=audit.summary;
  if(!validCount(pages,20000)||!validCount(errors)||!validCount(warnings)||
    errors!==audit.errors.length||warnings!==audit.warnings.length)
    throw Error('SEO brief: inconsistent audit counts');
  const tally=new Map();
  for(const issue of [...audit.errors,...audit.warnings]){
    if(!issue||typeof issue!=='object'||Array.isArray(issue))
      throw Error('SEO brief: invalid issue');
    const info=Object.hasOwn(ISSUE_ACTIONS,issue.type)?ISSUE_ACTIONS[issue.type]:
      ['medium','review_other_technical_findings'];
    const code=info[1];
    const prior=tally.get(code)||{code,priority:info[0],count:0};
    prior.count++;
    if(PRIORITY[info[0]]<PRIORITY[prior.priority])prior.priority=info[0];
    tally.set(code,prior);
  }
  return {
    status:errors>0?'review_required':warnings>0?'attention':'no_findings_in_supplied_audit',
    pages,errors,warnings,actions:[...tally.values()]
  };
}
function organicReport(trend){
  if(trend===null || trend===undefined)return null;
  if(!trend||typeof trend!=='object'||Array.isArray(trend)||
    trend.dataSource!=='two_user_provided_search_analytics_exports_not_verified'||
    !trend.summary||!Array.isArray(trend.changes)||trend.changes.length>1000)
    throw Error('SEO brief: compatible offline trend required');
  const {days,previous,current}=trend.summary;
  if(!validCount(days,92)||days<1||!previous||!current||
    !validCount(previous.clicks)||!validCount(current.clicks)||
    !validCount(previous.impressions)||!validCount(current.impressions)||
    previous.clicks>previous.impressions||current.clicks>current.impressions)
    throw Error('SEO brief: invalid trend summary');
  const counts=new Map();
  for(const change of trend.changes){
    if(!change||typeof change!=='object'||!Array.isArray(change.signals)||
      change.signals.length>5)throw Error('SEO brief: invalid trend signal');
    const distinct=new Set(change.signals);
    for(const signal of distinct){
      if(typeof signal!=='string'||!Object.hasOwn(SIGNAL_ACTIONS,signal))
        throw Error('SEO brief: unrecognized trend signal');
      const code=SIGNAL_ACTIONS[signal];
      counts.set(code,(counts.get(code)||0)+1);
    }
  }
  return {
    days,
    previous:{clicks:previous.clicks,impressions:previous.impressions},
    current:{clicks:current.clicks,impressions:current.impressions},
    clicksChangeFraction:delta(previous.clicks,current.clicks),
    impressionsChangeFraction:delta(previous.impressions,current.impressions),
    actions:[...counts].map(([code,count])=>({code,priority:'medium',count}))
  };
}
export function buildOfflineSeoBrief({audit,trend=null}={}){
  const technical=technicalReport(audit),organic=organicReport(trend);
  const actions=[...technical.actions,...(organic?.actions??[])].sort((a,b)=>
    PRIORITY[a.priority]-PRIORITY[b.priority]||b.count-a.count||
    a.code.localeCompare(b.code));
  return {
    contractVersion:'seo-brief-offline-v1',
    sourceType:'operator_supplied_offline_reports_unverified',
    technical:{
      status:technical.status,
      pages:technical.pages,errors:technical.errors,warnings:technical.warnings
    },
    organic:organic?{
      days:organic.days,previous:organic.previous,current:organic.current,
      clicksChangeFraction:organic.clicksChangeFraction,
      impressionsChangeFraction:organic.impressionsChangeFraction
    }:null,
    recommendedReviews:actions,
    limitations:[
      'These inputs were supplied locally; neither the audit nor the GSC trend is independently authenticated.',
      'Recommendations are review candidates, not proof of cause, conversion, ranking or indexing.',
      'Raw queries, page paths, user-provided messages and property URLs are omitted from this response.'
    ]
  };
}
