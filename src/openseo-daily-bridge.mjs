/**
 * SEO-F104 — strictly offline, bounded adapter for a manually supplied
 * date-only snapshot from the connected OpenSEO GSC reporting view.
 *
 * Connection in OpenSEO is NOT an OAuth/tenant grant for Imagine Portal.
 * No network, Google tokens, query terms, page URLs or hidden auth fields.
 */
import {createHash} from 'node:crypto';
import {canonicalProperty} from './gsc-readonly.mjs';
import {analyzeOfflineGscDailySeries} from './gsc-daily.mjs';

const INPUT=new Set(['tenantRef','expectedProperty','snapshot']);
const SNAPSHOT=new Set([
  'siteUrl','startDate','endDate','dimensions','rows','rowCount','hasMore'
]);
const ROW=new Set(['keys','clicks','impressions','ctr','position']);
const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;

function exactData(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const own=Reflect.ownKeys(value);
  return own.length===keys.size&&own.every(key=>{
    if(typeof key!=='string'||!keys.has(key))return false;
    const desc=Object.getOwnPropertyDescriptor(value,key);
    return desc&&Object.hasOwn(desc,'value')&&desc.enumerable;
  });
}
function strictArray(list,max){
  return Array.isArray(list)&&Object.getPrototypeOf(list)===Array.prototype&&
    list.length<=max&&Object.keys(list).length===list.length&&
    Object.keys(list).every(k=>/^(?:0|[1-9]\d*)$/.test(k))&&
    Reflect.ownKeys(list).length===list.length+1;
}

export function reviewOfflineOpenSeoDailySnapshot(input){
  if(!exactData(input,INPUT)||!exactData(input.snapshot,SNAPSHOT)||
    typeof input.tenantRef!=='string'||!TENANT.test(input.tenantRef))
    throw Error('SEO F104: exact offline snapshot and tenant scope required');
  let expected,received;
  try{
    expected=canonicalProperty(input.expectedProperty);
    received=canonicalProperty(input.snapshot.siteUrl);
  }catch{
    throw Error('SEO F104: invalid declared property');
  }
  if(expected!==received)
    throw Error('SEO F104: source and expected property differ');
  const s=input.snapshot;
  if(!strictArray(s.dimensions,1)||s.dimensions.length!==1||
    s.dimensions[0]!=='date'||!strictArray(s.rows,92)||
    !Number.isSafeInteger(s.rowCount)||s.rowCount!==s.rows.length||
    s.hasMore!==false)
    throw Error('SEO F104: complete date-only snapshot required');

  // Reject accessors, hidden values, additional auth claims, per-query/page
  // dimensions, missing dates or undocumented row payload fields.
  for(const row of s.rows){
    if(!exactData(row,ROW)||!strictArray(row.keys,1)||row.keys.length!==1||
      typeof row.keys[0]!=='string')
      throw Error('SEO F104: invalid date-only row');
  }
  const propertyFingerprint=createHash('sha256').update(expected,'utf8').digest('hex');
  const daily=analyzeOfflineGscDailySeries({
    rows:s.rows,responseAggregationType:'byProperty',metadata:{}
  },{
    tenantRef:input.tenantRef,propertyFingerprint,
    startDate:s.startDate,endDate:s.endDate,rowLimit:92
  });

  return {
    contractVersion:'seo-openseo-daily-offline-review-v1',
    sourceType:'operator_supplied_openseo_date_snapshot_not_provider_verified',
    tenantRef:daily.tenantRef,
    propertyFingerprint:daily.propertyFingerprint,
    period:daily.period,
    summary:daily.summary,
    daily:daily.daily,
    coverage:'returned_dates_only_missing_dates_unknown',
    sourceCompletenessNotProven:true,
    oauthVerifiedForImagine:false,
    portalTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_IMAGINE_BACKEND_AUTHORIZATION',
    caveats:[
      'The connected OpenSEO project does not grant OAuth or tenant access to Imagine Portal.',
      'A supplied JSON snapshot is not proof of provider origin, consent or complete Search Console traffic.',
      'Missing dates are unknown, not zero; no query terms or page URLs are accepted.'
    ]
  };
}
