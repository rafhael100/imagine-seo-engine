/**
 * SEO-F86 — privacy-gated executive view for TWO ORIGINAL offline GSC query
 * exports. Never accept a caller-computed trend, summary or OAuth grant.
 * This is only a review DTO, not an authenticated customer report.
 */
import {compareGscPeriods} from './organic-trends.mjs';
import {isStrictDataArray} from './gsc-strict-arrays.mjs';

const pair=new Set(['previous','current']);
const exportFields=new Set(['dimensions','startDate','endDate','rows']);
const rowFields=new Set(['keys','clicks','impressions','ctr','position']);

function exact(value,allowed){
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
    [Object.prototype,null].includes(Object.getPrototypeOf(value))&&
    Reflect.ownKeys(value).length===allowed.size&&
    Reflect.ownKeys(value).every(k=>typeof k==='string'&&allowed.has(k)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value'));
}
function originalQueryExport(input){
  if(!exact(input,exportFields)||
    !isStrictDataArray(input.dimensions,1)||
    input.dimensions.length!==1||input.dimensions[0]!=='query'||
    !isStrictDataArray(input.rows,100000))
    throw Error('SEO organic display: original query export required');
  for(const row of input.rows){
    if(!exact(row,rowFields)||
      !isStrictDataArray(row.keys,1)||row.keys.length!==1||
      typeof row.keys[0]!=='string')
      throw Error('SEO organic display: invalid original query row');
  }
}

export function prepareOfflineGscOrganicTrendDisplay(input){
  if(!exact(input,pair))
    throw Error('SEO organic display: exact original two-period evidence required');
  originalQueryExport(input.previous);
  originalQueryExport(input.current);
  // Recompute independently from validated original rows, not supplied summary.
  // This also enforces date windows, CTR arithmetic and duplicate-query checks.
  const trend=compareGscPeriods(input.previous,input.current);
  const withheld=trend.summary.redactedRows>0;
  const s=trend.summary;
  return {
    contractVersion:'seo-gsc-organic-trend-display-offline-v1',
    sourceType:'two_operator_supplied_query_exports_unverified',
    periods:{previous:trend.previousPeriod,current:trend.currentPeriod},
    coverageStatus:withheld?'REDACTED_ROWS_NO_COMPARISON':
      'SUPPLIED_ROWS_ONLY_NOT_VERIFIED',
    metricsWithheld:withheld,
    metricsWithheldReason:withheld?'PRIVACY_REDACTION':null,
    summary:{
      days:s.days,
      receivedRows:{
        previous:input.previous.rows.length,
        current:input.current.rows.length
      },
      redactedRows:s.redactedRows,
      previous:withheld?null:{...s.previous},
      current:withheld?null:{...s.current},
      clicksChangePct:withheld?null:s.clicksChangePct,
      impressionsChangePct:withheld?null:s.impressionsChangePct,
      flaggedClusters:withheld?0:s.flaggedClusters
    },
    changes:withheld?[]:trend.changes,
    reviewStatus:'REQUIRES_AUTHENTICATED_HUMAN_REVIEW',
    oauthVerified:false,
    propertyAuthorizationVerified:false,
    backendTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_AUTHORIZATION',
    caveats:[
      'Any redacted query row suppresses all period totals, deltas, clusters and signals.',
      'Unredacted metrics describe only rows supplied by the operator, not complete Google traffic.',
      'This module has no tenant authentication, property grant, Google network access or publication permission.'
    ]
  };
}
