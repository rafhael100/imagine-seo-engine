/**
 * SEO-F65 — Compare query/page overlap between two independently validated
 * offline Search Analytics exports without emitting search terms or URLs.
 * Never interpret changes as proof of cannibalization or complete traffic.
 */
import {reviewOfflineGscQueryPageOverlap} from './gsc-query-page-overlap.mjs';
import {gscDay} from './gsc-period.mjs';

const allowedPair=new Set(['previous','current']);
const allowedWindow=new Set(['scope','response']);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(x));
const shape=(x,allowed)=>plain(x)&&
  Reflect.ownKeys(x).length===allowed.size&&
  Reflect.ownKeys(x).every(k=>typeof k==='string'&&allowed.has(k)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
const ratio=(a,b)=>b>0?Math.round(a/b*10000)/10000:null;
const difference=(a,b)=>Math.round((b-a)*10000)/10000;

export function compareOfflineGscQueryPageOverlapPeriods(input){
  if(!shape(input,allowedPair)||
    !shape(input.previous,allowedWindow)||
    !shape(input.current,allowedWindow))
    throw Error('SEO overlap trend: exact two-period evidence required');

  // Revalidate underlying rows; never accept a caller-computed aggregate
  // that could forge identities, coverage, or publication privileges.
  const previous=reviewOfflineGscQueryPageOverlap(
    input.previous.response,input.previous.scope);
  const current=reviewOfflineGscQueryPageOverlap(
    input.current.response,input.current.scope);
  if(previous.tenantRef!==current.tenantRef||
    previous.propertyFingerprint!==current.propertyFingerprint)
    throw Error('SEO overlap trend: cross-tenant/property comparison forbidden');
  const p=previous.period,c=current.period;
  const pDays=gscDay(p.endDate)-gscDay(p.startDate)+1;
  const cDays=gscDay(c.endDate)-gscDay(c.startDate)+1;
  if(pDays!==cDays||gscDay(p.endDate)>=gscDay(c.startDate))
    throw Error('SEO overlap trend: equal non-overlapping periods required');

  const a=previous.summary,b=current.summary;
  const aRate=ratio(a.queriesOnMultiplePages,a.distinctQueries);
  const bRate=ratio(b.queriesOnMultiplePages,b.distinctQueries);
  const complete=!a.possibleTruncation&&!b.possibleTruncation;
  const delta=aRate!==null&&bRate!==null?difference(aRate,bRate):null;
  const signals=[];
  if(complete&&delta!==null&&a.distinctQueries>=10&&
    b.distinctQueries>=10&&b.queriesOnMultiplePages>=4&&delta>=0.15)
    signals.push('review_overlap_share_increase');

  return {
    contractVersion:'seo-gsc-query-page-overlap-trend-offline-v1',
    sourceType:'two_operator_supplied_query_page_exports_not_verified',
    tenantRef:previous.tenantRef,
    propertyFingerprint:previous.propertyFingerprint,
    periods:{previous:p,current:c},
    comparisonDays:pDays,
    coverageStatus:complete?'COMPLETE_SUPPLIED_BATCHES':'PARTIAL_GSC_BATCHES_NO_SIGNALS',
    coverageComplete:complete,
    previous:{
      receivedRows:a.receivedRows,
      redactedRows:a.redactedRows,
      distinctQueries:a.distinctQueries,
      queriesOnMultiplePages:a.queriesOnMultiplePages,
      overlapShare:aRate
    },
    current:{
      receivedRows:b.receivedRows,
      redactedRows:b.redactedRows,
      distinctQueries:b.distinctQueries,
      queriesOnMultiplePages:b.queriesOnMultiplePages,
      overlapShare:bRate
    },
    overlapShareChange:complete?delta:null,
    reviewSignals:signals,
    oauthVerified:false,
    tenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_BACKEND_VERIFICATION',
    caveats:[
      'Increased overlap share is an editorial review indicator, never proof of SEO cannibalization.',
      'Date and batch coverage only describe supplied rows; Google can omit or anonymize queries.',
      'No terms, URLs or reversible query identities are returned.'
    ]
  };
}
