/**
 * SEO-F10 — Query planner and response validator for a future read-only
 * Search Console OAuth integration. This module performs ZERO network calls.
 */
import {createHash} from 'node:crypto';
import {validateGscPeriod} from './gsc-period.mjs';
import {analyzeQueryExport} from './opportunities.mjs';
import {isStrictDataArray} from './gsc-strict-arrays.mjs';

const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const DOMAIN=/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const REQUIRED_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
const sha256=value=>createHash('sha256').update(value).digest('hex');

export function canonicalProperty(siteUrl){
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
const PLAN_INPUT_FIELDS=new Set([
  'tenantRef','siteUrl','startDate','endDate','authorizationConfirmed',
  'rowLimit','startRow'
]);

export function planGscQuery(input={}){
  if(!input || typeof input!=='object' || Array.isArray(input) ||
    ![Object.prototype,null].includes(Object.getPrototypeOf(input)) ||
    Reflect.ownKeys(input).some(key=>{
      if(typeof key!=='string'||!PLAN_INPUT_FIELDS.has(key))return true;
      const descriptor=Object.getOwnPropertyDescriptor(input,key);
      return !descriptor || !Object.hasOwn(descriptor,'value');
    }))
    throw Error('SEO GSC plan: unsupported planner input');
  const {tenantRef,siteUrl,startDate,endDate,authorizationConfirmed,
    rowLimit=1000,startRow=0}=input;
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

const REQUIRED_PLAN_FIELDS=new Set([
  'contractVersion','tenantRef','propertyFingerprint','requiredOAuthScope',
  'authorization','method','url','body','networkPerformed'
]);
const REQUIRED_BODY_FIELDS=new Set([
  'startDate','endDate','dimensions','type','aggregationType',
  'dataState','rowLimit','startRow'
]);
// F94: external JSON-style evidence must have only ordinary own data fields.
 // Accessors, symbols, hidden grants and inherited fields cannot be used to
 // smuggle authorization or trigger private reads while validating evidence.
const ownDataFields=(value,allowed,requireAll=false)=>{
  if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const keys=Reflect.ownKeys(value);
  if(requireAll&&keys.length!==allowed.size)return false;
  for(const key of keys){
    if(typeof key!=='string'||!allowed.has(key))return false;
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!descriptor||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)
      return false;
  }
  return true;
};
const exactFields=(value,allowed)=>ownDataFields(value,allowed,true);

/**
 * SEO-F42 — every provider-shaped API response is analyzed only against a
 * fully revalidated, canonical, read-only query contract. No network.
 */
export function validateOfflineGscQueryPlan(plan){
  if(!exactFields(plan,REQUIRED_PLAN_FIELDS)||
    plan.contractVersion!=='seo-gsc-readonly-plan-v1'||
    typeof plan.tenantRef!=='string'||!TENANT.test(plan.tenantRef)||
    typeof plan.propertyFingerprint!=='string'||
    !/^[a-f0-9]{64}$/.test(plan.propertyFingerprint)||
    plan.requiredOAuthScope!==REQUIRED_SCOPE||
    plan.authorization!=='operator_declared_provider_verification_pending'||
    plan.method!=='POST'||plan.networkPerformed!==false||
    !exactFields(plan.body,REQUIRED_BODY_FIELDS)||
    plan.body.type!=='web'||plan.body.dataState!=='final'||
    plan.body.aggregationType!=='byProperty'||
    !isStrictDataArray(plan.body.dimensions,1)||
    plan.body.dimensions.length!==1||plan.body.dimensions[0]!=='query'||
    !Number.isSafeInteger(plan.body.rowLimit)||plan.body.rowLimit<1||
    plan.body.rowLimit>25000||
    !Number.isSafeInteger(plan.body.startRow)||plan.body.startRow<0||
    plan.body.startRow>100000)
    throw Error('SEO GSC plan: incompatible readonly contract');
  if(typeof plan.url!=='string'||plan.url.length>4096)
    throw Error('SEO GSC plan: invalid provider URL');
  const match=plan.url.match(
    /^https:\/\/www\.googleapis\.com\/webmasters\/v3\/sites\/([^/?#]+)\/searchAnalytics\/query$/
  );
  if(!match)throw Error('SEO GSC plan: invalid provider URL');
  let property;
  try{property=canonicalProperty(decodeURIComponent(match[1]));}
  catch{throw Error('SEO GSC plan: invalid provider URL');}
  if(encodeURIComponent(property)!==match[1]||
    sha256(property)!==plan.propertyFingerprint)
    throw Error('SEO GSC plan: property fingerprint or URL mismatch');
  try{validateGscPeriod(plan.body.startDate,plan.body.endDate);}
  catch{throw Error('SEO GSC plan: invalid reporting period');}
  return {
    tenantRef:plan.tenantRef,
    propertyFingerprint:plan.propertyFingerprint,
    startDate:plan.body.startDate,
    endDate:plan.body.endDate,
    rowLimit:plan.body.rowLimit,
    startRow:plan.body.startRow,
    networkPerformed:false,
    productionReadAuthorized:false
  };
}

/**
 * Only normalizes provider-shaped data SUPPLIED to this pure function.
 * No Google response is treated as verified without the authenticated caller.
 */
export function analyzeGscQueryResponse(raw,plan){
  try { validateOfflineGscQueryPlan(plan); }
  catch { throw Error('SEO GSC response: compatible query plan required'); }
  const responseFields=new Set(['rows','responseAggregationType','metadata']);
  const rowFields=new Set(['keys','clicks','impressions','ctr','position']);
  if(!ownDataFields(raw,responseFields)||
    (Object.hasOwn(raw,'rows')&&
      !isStrictDataArray(raw.rows,25000)))
    throw Error('SEO GSC response: invalid response');
  if(raw.responseAggregationType!==undefined &&
    raw.responseAggregationType!==plan.body.aggregationType)
    throw Error('SEO GSC response: unexpected aggregation type');
  // Only the documented incomplete-date/hour signals are recognized.
  // Presence of either signal means a final-data report cannot be trusted,
  // even if an adversarial fixture supplies an empty or null value.
  const metadataFields=new Set(['first_incomplete_date','first_incomplete_hour']);
  if(Object.hasOwn(raw,'metadata') &&
    (!ownDataFields(raw.metadata,metadataFields) ||
      Object.hasOwn(raw.metadata,'first_incomplete_date') ||
      Object.hasOwn(raw.metadata,'first_incomplete_hour')))
    throw Error('SEO GSC response: unexpected or incomplete metadata');
  const rows=raw.rows??[];
  if(rows.length>plan.body.rowLimit)
    throw Error('SEO GSC response: exceeds requested rowLimit');
  // Search Analytics query rows are returned by clicks descending. A single
  // page must not silently admit duplicates or out-of-order rows either.
  let previousClicks=Infinity;
  const seen=new Set();
  for(const row of rows){
    if(!exactFields(row,rowFields)||
      !isStrictDataArray(row.keys,1)||row.keys.length!==1||
      typeof row.keys[0]!=='string'||!Number.isSafeInteger(row.clicks)||
      row.clicks<0||row.clicks>previousClicks)
      throw Error('SEO GSC response: invalid query order or key');
    if(seen.has(row.keys[0]))
      throw Error('SEO GSC response: duplicate query key');
    seen.add(row.keys[0]);
    previousClicks=row.clicks;
  }
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
