/**
 * SEO F162 — compare two locally supplied, pre-published Astro HTML audits.
 *
 * This is a MONITORING candidate, not an authenticated live measurement:
 * - requires explicit distinct 40-character source revisions;
 * - fails closed if either audited route inventory is absent/invalid;
 * - withholds regression claims if HTML route coverage changed;
 * - emits aggregate counts and existing Portal review codes only;
 * - never serializes private paths, query strings, issue text, or page URLs.
 */
import {buildOfflineSeoBrief} from './seo-brief.mjs';

const SHA=/^[0-9a-f]{40}$/;
const rank=Object.freeze({critical:0,high:1,medium:2,low:3});
const safeScope=(value)=>typeof value==='string'&&SHA.test(value);
const safeAudit=(audit)=>{
 if(!audit||typeof audit!=='object'||Array.isArray(audit)||
    !Array.isArray(audit.routes)||audit.routes.length===0)
   throw Error('SEO technical regression: route evidence required');
 return buildOfflineSeoBrief({audit});
};
const byCode=entries=>new Map(entries.map(item=>[item.code,item]));
const summaryOf=brief=>Object.freeze({
 pages:brief.technical.pages,errors:brief.technical.errors,
 warnings:brief.technical.warnings
});

/**
 * Contract intentionally distinct from a Portal handoff. Consumers may show
 * this only inside a human-reviewed LOCAL development report, never customer UI.
 */
export function compareOfflineTechnicalAudits({previous,current,previousRevision,currentRevision}={}){
 if(!safeScope(previousRevision)||!safeScope(currentRevision)||
    previousRevision===currentRevision)
   throw Error('SEO technical regression: distinct local source revisions required');
 const before=safeAudit(previous),after=safeAudit(current);
 const beforeRoutes=new Set(previous.routes),afterRoutes=new Set(current.routes);
 const comparable=beforeRoutes.size===afterRoutes.size&&
   [...beforeRoutes].every(path=>afterRoutes.has(path));
 // A changed inventory requires an editorial migration review, but operators
 // can still see the exact aggregate scope without exposing private URLs.
 const routeInventoryChanges=Object.freeze({
  added:[...afterRoutes].filter(path=>!beforeRoutes.has(path)).length,
  removed:[...beforeRoutes].filter(path=>!afterRoutes.has(path)).length
 });
 const result={
  contractVersion:'seo-technical-regression-offline-v1',
  sourceType:'two_operator_supplied_static_audits_unverified',
  previousRevision,currentRevision,
  routeCoverageComparable:comparable,
  routeInventoryChanges,
  status:'HOLD_ROUTE_COVERAGE_CHANGED',
  previous:summaryOf(before),current:summaryOf(after),
  reviewIncreases:[],
  releaseStatus:'HOLD_EXTERNAL_AUTHORIZATION',
  customerDisplayAuthorized:false,
  publicationAuthorized:false,
  limitation:'Local, unverified source revisions and audit files. No Google/tenant authority, ranking or release readiness can be inferred.'
 };
 if(!comparable)return Object.freeze(result);
 const old=byCode(before.recommendedReviews);
 const changes=after.recommendedReviews.flatMap(item=>{
   const previousCount=old.get(item.code)?.count??0;
   if(item.count<=previousCount)return [];
   return [{
    code:item.code,priority:item.priority,
    previousCount,currentCount:item.count,increase:item.count-previousCount
   }];
 }).sort((a,b)=>rank[a.priority]-rank[b.priority]||
    b.increase-a.increase||a.code.localeCompare(b.code));
 return Object.freeze({
  ...result,
  status:after.technical.errors>before.technical.errors||
    after.technical.warnings>before.technical.warnings||changes.length>0
    ?'REVIEW_AGGREGATE_REGRESSION':'NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS',
  reviewIncreases:Object.freeze(changes)
 });
}
