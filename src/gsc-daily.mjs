/**
 * SEO-F52 — Offline normalization of Search Console date-dimension rows.
 * Consumes ONLY operator-supplied data; no OAuth, provider I/O or proof that
 * the selected property or tenant belongs to the caller.
 */
import {gscDay,validateGscPeriod} from './gsc-period.mjs';

const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const FINGERPRINT=/^[a-f0-9]{64}$/;
const SETTINGS=new Set(['tenantRef','propertyFingerprint','startDate','endDate','rowLimit']);
const RESPONSE=new Set(['rows','responseAggregationType','metadata']);
const ROW=new Set(['keys','clicks','impressions','ctr','position']);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(value));
const ownData=(value,fields,required=false)=>{
  if(!plain(value))return false;
  const keys=Reflect.ownKeys(value);
  return (!required||keys.length===fields.size)&&keys.every(key=>
    typeof key==='string'&&fields.has(key)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'));
};
const round=(value,places)=>Math.round(value*10**places)/10**places;

export function analyzeOfflineGscDailySeries(raw,options={}){
  if(!ownData(options,SETTINGS)||!ownData(raw,RESPONSE)||
    !Object.hasOwn(raw,'rows')||!Array.isArray(raw.rows))
    throw Error('SEO GSC daily: unsupported contract');
  const {tenantRef,propertyFingerprint,startDate,endDate,rowLimit=92}=options;
  if(typeof tenantRef!=='string'||!TENANT.test(tenantRef)||
    typeof propertyFingerprint!=='string'||!FINGERPRINT.test(propertyFingerprint)||
    !Number.isSafeInteger(rowLimit)||rowLimit<1||rowLimit>92)
    throw Error('SEO GSC daily: invalid offline scope');
  let period;
  try {period=validateGscPeriod(startDate,endDate);}
  catch {throw Error('SEO GSC daily: invalid reporting period');}
  if(raw.rows.length>rowLimit)
    throw Error('SEO GSC daily: exceeds row limit');
  if(raw.responseAggregationType!==undefined&&
    raw.responseAggregationType!=='byProperty')
    throw Error('SEO GSC daily: unexpected aggregation type');
  if(raw.metadata!==undefined&&(!plain(raw.metadata)||
    Reflect.ownKeys(raw.metadata).length!==0))
    throw Error('SEO GSC daily: incomplete or unexpected metadata');

  const seen=new Set();
  const result=[];
  let clicks=0,impressions=0,weightedPosition=0;
  for(const row of raw.rows){
    if(!ownData(row,ROW,true)||!Array.isArray(row.keys)||
      row.keys.length!==1||typeof row.keys[0]!=='string')
      throw Error('SEO GSC daily: invalid date row');
    const date=row.keys[0];
    let day;
    try {day=gscDay(date);}
    catch {throw Error('SEO GSC daily: invalid date row');}
    if(day<period.startDay||day>period.endDay||seen.has(date))
      throw Error('SEO GSC daily: duplicate or out-of-period date');
    seen.add(date);
    const {clicks:rowClicks,impressions:rowImpressions,ctr,position}=row;
    if(!Number.isSafeInteger(rowClicks)||rowClicks<0||
      !Number.isSafeInteger(rowImpressions)||rowImpressions<0||
      rowClicks>rowImpressions||
      typeof ctr!=='number'||!Number.isFinite(ctr)||ctr<0||ctr>1||
      (rowImpressions===0&&ctr!==0)||
      (rowImpressions>0&&Math.abs(ctr-rowClicks/rowImpressions)>0.02)||
      (rowImpressions>0&&
        (typeof position!=='number'||!Number.isFinite(position)||position<1))||
      (rowImpressions===0&&position!==null))
      throw Error('SEO GSC daily: invalid row metrics');
    clicks+=rowClicks;
    impressions+=rowImpressions;
    weightedPosition+=rowImpressions*(position??0);
    if(!Number.isSafeInteger(clicks)||!Number.isSafeInteger(impressions)||
      !Number.isFinite(weightedPosition))
      throw Error('SEO GSC daily: counter overflow');
    result.push({
      date,clicks:rowClicks,impressions:rowImpressions,
      ctr:rowImpressions?round(rowClicks/rowImpressions,4):0,
      averagePosition:rowImpressions?round(position,2):null
    });
  }
  result.sort((a,b)=>a.date.localeCompare(b.date));
  return {
    contractVersion:'seo-gsc-daily-offline-v1',
    sourceType:'operator_supplied_date_dimension_unverified',
    tenantRef,propertyFingerprint,
    period:{startDate,endDate,requestedDays:period.days,
      returnedDays:result.length,unreturnedDays:period.days-result.length},
    summary:{
      clicks,impressions,
      ctr:impressions?round(clicks/impressions,4):0,
      weightedAveragePosition:impressions?
        round(weightedPosition/impressions,2):null
    },
    daily:result,
    coverage:'returned_dates_only_not_total_property_traffic',
    mayHaveMore:raw.rows.length===rowLimit,
    oauthVerified:false,
    tenantGrantVerified:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_BACKEND_VERIFICATION',
    caveats:[
      'Missing dates are unknown, not proof of zero clicks or impressions.',
      'Aggregates describe supplied rows only, not all property traffic.',
      'This adapter does not read Google or verify tenant, property, consent or OAuth.'
    ]
  };
}
