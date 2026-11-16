/**
 * SEO-F88 — a single reviewed offline path from ORIGINAL GSC query rows
 * to a sanitized executive brief and non-publishable Portal envelope.
 * Neither an asserted summary nor an asserted authorization is evidence.
 */
import {prepareOfflineGscOrganicTrendDisplay} from './gsc-organic-trend-display.mjs';
import {compareGscPeriods} from './organic-trends.mjs';
import {buildOfflineSeoBrief} from './seo-brief.mjs';
import {preparePortalSeoHandoff} from './portal-handoff.mjs';

const INPUT=new Set(['audit','previous','current','scope']);
const SCOPE=new Set(['tenantRef','propertyFingerprint','sourceRevision']);
function exactData(value,fields){
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
    [Object.prototype,null].includes(Object.getPrototypeOf(value))&&
    Reflect.ownKeys(value).length===fields.size&&
    Reflect.ownKeys(value).every(k=>typeof k==='string'&&fields.has(k)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value'));
}

export function prepareOfflinePortalSeoFromOriginalGsc(input){
  if(!exactData(input,INPUT)||!exactData(input.scope,SCOPE))
    throw Error('SEO F88: original evidence and offline scope required');

  const source={previous:input.previous,current:input.current};
  // F86 strictly validates the ORIGINAL period objects and rows, including
  // forged permissions, getters, arrays, periods and duplicate query strings.
  const display=prepareOfflineGscOrganicTrendDisplay(source);
  // Recompute the legacy technical trend FROM THE SAME rows (do not accept
  // trend or summary produced by a caller). F87 withholds redacted signals.
  const trend=compareGscPeriods(input.previous,input.current);
  const brief=buildOfflineSeoBrief({audit:input.audit,trend});
  if(display.metricsWithheld!==Boolean(trend.summary.redactedRows>0)||
    (display.metricsWithheld && (
      brief.organic!==null||
      brief.recommendedReviews.some(r=>r.code.startsWith('review_')&&[
        'review_impression_drop','review_click_drop','review_ctr_drop',
        'review_average_position','review_new_search_theme'
      ].includes(r.code))
    )))
    throw Error('SEO F88: privacy policy disagreement');

  const handoff=preparePortalSeoHandoff({...input.scope,brief});
  if(display.metricsWithheld && handoff.organic!==null)
    throw Error('SEO F88: unsafe organic handoff');
  return {
    contractVersion:'seo-portal-original-gsc-handoff-offline-v1',
    sourceType:'operator_supplied_original_query_rows_not_google_verified',
    coverage:{
      status:display.coverageStatus,
      metricsWithheld:display.metricsWithheld,
      reason:display.metricsWithheldReason,
      receivedRows:{...display.summary.receivedRows},
      redactedRows:display.summary.redactedRows
    },
    brief,
    handoff,
    oauthVerified:false,
    propertyAuthorizationVerified:false,
    backendTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_AUTHORIZATION',
    caveats:[
      'An operator-supplied source revision, property fingerprint or scope is not proof of OAuth or tenant access.',
      'This review uses only supplied rows and may omit anonymized or paginated Google data.',
      'Only a trusted Portal backend can independently authorize customer access or publication.'
    ]
  };
}
