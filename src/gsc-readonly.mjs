/**
 * SEO-F10 — Query planner and response validator for a future read-only
 * Search Console OAuth integration. This module performs ZERO network calls.
 */
import {createHash} from 'node:crypto';
import {validateGscPeriod} from './gsc-period.mjs';
import {analyzeQueryExport} from './opportunities.mjs';

const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const DOMAIN=/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const REQUIRED_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
const sha256=value=>createHash('sha256').update(value).digest('hex');

function canonicalProperty(siteUrl){
  if(typeof siteUrl!=='string'||siteUrl.length>2048)
    throw Error('SEO GSC plan: invalid property');
  if(siteUrl.startsWith('sc-domain:')){
    const domain=siteUrl.slice('sc-domain:'.length).toLowerCase();
    if(!DOMAIN.test(domain))throw Error('SEO GSC plan: invalid domain property');
    return 'sc-domain:'+domain;
  }
  let url;
  try {url=new URL(siteUrl);} catch{throw Error('SEO GSC plan: invalid URL property');}
  if(url.protocol!=='https:'||!DOMAIN.test(url.hostname)||
    url.username||url.password||url.search||url.hash)
    throw Error('SEO GSC plan: secure URL-prefix property required');
  return url.origin+url.pathname;
}

/**
 * Returns a request description, NEVER an authenticated client.
 * No bearer token or Google secret is used or stored here.
 */
export function planGscQuery({
  tenantRef,siteUrl,startDate,endDate,authorizationConfirmed,
  rowLimit=1000,startRow=0
}={}){
  if(typeof tenantRef!=='string'||!TENANT.test(tenantRef))
    throw Error('SEO GSC plan: invalid tenant reference');
  if(authorizationConfirmed!==true)
    throw Error('SEO GSC plan: operator declaration required');
  const property=canonicalProperty(siteUrl);
  validateGscPeriod(startDate,endDate);
  if(!Number.isSafeInteger(rowLimit)||rowLimit<1||rowLimit>25000)
    throw Error('SEO GSC plan: rowLimit must be 1..25000');
  if(!Number.isSafeInteger(startRow)||startRow<0||startRow>100000)
    throw Error('SEO GSC plan: invalid pagination offset');
  const body=Object.freeze({
    startDate,endDate,dimensions:['query'],type:'web',
    aggregationType:'byProperty',dataState:'final',rowLimit,startRow
  });
  return {
    contractVersion:'seo-gsc-readonly-plan-v1',
    tenantRef,
    propertyFingerprint:sha256(property),
    requiredOAuthScope:REQUIRED_SCOPE,
    authorization:'operator_declared_provider_verification_pending',
    method:'POST',
    url:'https://www.googleapis.com/webmasters/v3/sites/'+
      encodeURIComponent(property)+'/searchAnalytics/query',
    body,
    networkPerformed:false
  };
}

/**
 * Only normalizes provider-shaped data SUPPLIED to this pure function.
 * No Google response is treated as verified without the authenticated caller.
 */
export function analyzeGscQueryResponse(raw,plan){
  if(!plan||plan.contractVersion!=='seo-gsc-readonly-plan-v1' ||
    plan.method!=='POST'||plan.requiredOAuthScope!==REQUIRED_SCOPE ||
    !plan.body||!Number.isSafeInteger(plan.body.rowLimit)||
    plan.body.rowLimit<1||plan.body.rowLimit>25000||
    !Number.isSafeInteger(plan.body.startRow)||plan.body.startRow<0||
    plan.body.aggregationType!=='byProperty'||
    plan.body.dataState!=='final'||plan.body.type!=='web'||
    !Array.isArray(plan.body.dimensions)||plan.body.dimensions.length!==1||
    plan.body.dimensions[0]!=='query')
    throw Error('SEO GSC response: compatible query plan required');
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    (raw.rows!==undefined&&!Array.isArray(raw.rows)))
    throw Error('SEO GSC response: invalid response');
  if(raw.responseAggregationType!==undefined &&
    raw.responseAggregationType!==plan.body.aggregationType)
    throw Error('SEO GSC response: unexpected aggregation type');
  if(raw.metadata!==undefined &&
    (!raw.metadata || typeof raw.metadata!=='object' || Array.isArray(raw.metadata) ||
      raw.metadata.first_incomplete_date || raw.metadata.first_incomplete_hour))
    throw Error('SEO GSC response: unexpected or incomplete metadata');
  const rows=raw.rows??[];
  if(rows.length>plan.body.rowLimit)
    throw Error('SEO GSC response: exceeds requested rowLimit');
  const report=analyzeQueryExport({
    dimensions:['query'],
    startDate:plan.body.startDate,
    endDate:plan.body.endDate,
    rows
  });
  return {
    contractVersion:'seo-gsc-normalized-offline-v1',
    tenantRef:plan.tenantRef,
    propertyFingerprint:plan.propertyFingerprint,
    sourceType:'operator_supplied_api_shaped_response_not_verified',
    pagination:{startRow:plan.body.startRow,rowsReceived:rows.length,
      mayHaveMore:rows.length===plan.body.rowLimit},
    ...report,
    caveats:[
      'OAuth and property access must be verified by an authenticated Portal backend before a real API call.',
      'Query rows can be omitted or truncated by Search Console; this is not total property traffic.',
      'No network operation or token exchange is performed by this adapter.'
    ]
  };
}
