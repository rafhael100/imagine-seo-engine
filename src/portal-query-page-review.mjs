/**
 * SEO-F74 — review-only query/page metrics for a future authenticated Portal.
 * Recomputes all aggregates from original plan/pages via F72, never trusts a
 * caller-computed report and never grants customer display or publication.
 */
import {reviewOfflineGscQueryPagePlannedBatch}
  from './gsc-query-page-plan-binding.mjs';

const INPUT=new Set(['sourceRevision','plan','pages']);
const sha=/^[0-9a-f]{40}$/;
function exactData(value,allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const own=Reflect.ownKeys(value);
  return own.length===allowed.size&&own.every(key=>
    typeof key==='string'&&allowed.has(key)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'));
}

export function prepareOfflinePortalQueryPageReview(input){
  if(!exactData(input,INPUT)||typeof input.sourceRevision!=='string'||
    !sha.test(input.sourceRevision))
    throw Error('SEO Portal query/page: exact offline evidence required');
  const report=reviewOfflineGscQueryPagePlannedBatch({
    plan:input.plan,pages:input.pages
  });
  const s=report.summary;
  const partial=s.possibleTruncation||report.pagination.mayHaveMore;
  const redacted=s.redactedRows>0;
  const coverageStatus=redacted?'REDACTED_ROWS_NO_SIGNALS':
    partial?'PARTIAL_BATCH_NO_SIGNALS':'SUPPLIED_BATCH_ONLY_UNVERIFIED';
  const actionable=!redacted&&!partial&&s.queriesOnMultiplePages>0;
  return {
    contractVersion:'seo-portal-query-page-review-offline-v1',
    sourceType:'operator_supplied_query_page_batch_unverified',
    scope:{
      tenantRef:report.tenantRef,
      propertyFingerprint:report.propertyFingerprint,
      sourceRevision:input.sourceRevision
    },
    period:report.period,
    coverageStatus,
    reviewStatus:'REQUIRES_AUTHENTICATED_HUMAN_REVIEW',
    summary:{
      receivedRows:s.receivedRows,
      redactedRows:s.redactedRows,
      analyzedRows:s.analyzedRows,
      distinctQueries:s.distinctQueries,
      queriesOnMultiplePages:s.queriesOnMultiplePages,
      pagesAcrossOverlappingQueries:s.totalPagesAcrossOverlappingQueries
    },
    pagination:{
      pagesReceived:report.pagination.pagesReceived,
      pageSize:report.pagination.pageSize,
      lastPageRows:report.pagination.lastPageRows,
      mayHaveMore:report.pagination.mayHaveMore
    },
    suggestedReviews:actionable?['review_query_page_overlap']:[],
    oauthVerified:false,
    propertyAuthorizationVerified:false,
    backendTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_AUTHORIZATION',
    limitations:[
      'The Portal must verify user identity, tenant grant and property consent independently.',
      'Supplied rows are not Google-verified and cannot prove cannibalization or complete traffic.',
      'No search term, page URL, redirect candidate or token is exposed.'
    ]
  };
}
