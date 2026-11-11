/**
 * SEO-F79 — review-only display model derived from ORIGINAL offline plan/pages.
 * Never accepts caller-computed reports; privacy-restricted data displays
 * only row receipt/redaction counts, not query counts or overlap metrics.
 *
 * This DTO is not permission to render to an authenticated customer.
 */
import {prepareOfflinePortalQueryPageReview} from './portal-query-page-review.mjs';

export function prepareOfflinePortalQueryPageDisplayModel(input){
  // F74 revalidates F72/F59 rows, tenant/property declaration, page offsets
  // and all negative privilege flags. No untrusted precomputed DTO is used.
  const review=prepareOfflinePortalQueryPageReview(input);
  const safeSample=review.coverageStatus==='SUPPLIED_BATCH_ONLY_UNVERIFIED';
  const s=review.summary;
  return {
    contractVersion:'seo-portal-query-page-display-offline-v1',
    sourceType:'operator_supplied_synthetic_review_only',
    scope:{
      tenantRef:review.scope.tenantRef,
      propertyFingerprint:review.scope.propertyFingerprint,
      sourceRevision:review.scope.sourceRevision
    },
    period:review.period,
    coverageStatus:review.coverageStatus,
    metricsWithheld:!safeSample,
    metricsWithheldReason:safeSample?null:
      review.coverageStatus==='REDACTED_ROWS_NO_SIGNALS'?
        'PRIVACY_REDACTION':'POSSIBLE_INCOMPLETE_PAGINATION',
    summary:{
      receivedRows:s.receivedRows,
      redactedRows:s.redactedRows,
      analyzedRows:safeSample?s.analyzedRows:null,
      distinctQueries:safeSample?s.distinctQueries:null,
      queriesOnMultiplePages:safeSample?s.queriesOnMultiplePages:null,
      pagesAcrossOverlappingQueries:
        safeSample?s.pagesAcrossOverlappingQueries:null
    },
    pagination:{
      pagesReceived:review.pagination.pagesReceived,
      mayHaveMore:review.pagination.mayHaveMore
    },
    suggestedReviews:safeSample?[...review.suggestedReviews]:[],
    reviewStatus:'REQUIRES_AUTHENTICATED_HUMAN_REVIEW',
    oauthVerified:false,
    propertyAuthorizationVerified:false,
    backendTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_AUTHORIZATION',
    caveats:[
      'Percentages and overlapping query counts from redacted or possibly partial data are withheld.',
      'This offline sample is not verified Google traffic or proof of cannibalization.',
      'Only an authenticated Portal can separately verify tenant/property grants.'
    ]
  };
}
