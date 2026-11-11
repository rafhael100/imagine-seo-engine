/**
 * SEO-F54 — comparison of two independently revalidated date-dimension GSC
 * exports. All observations are operator-supplied, local and unverified.
 * Partial coverage MUST NOT produce drop/ranking review signals.
 */
import {analyzeOfflineGscDailySeries} from './gsc-daily.mjs';
import {gscDay} from './gsc-period.mjs';

const keys=(x,expected)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(x))&&
  Reflect.ownKeys(x).length===expected.length&&
  Reflect.ownKeys(x).every(k=>typeof k==='string'&&expected.includes(k)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
const round=(n,d=3)=>Math.round((n+Number.EPSILON)*10**d)/10**d;
const delta=(previous,current)=>previous>0?round((current-previous)/previous,3):null;
const computeCompleteness=r=>r.period.unreturnedDays===0&&!r.mayHaveMore;

export function compareOfflineGscDailyPeriods(input){
  if(!keys(input,['previous','current'])||
    !keys(input.previous,['scope','response'])||
    !keys(input.current,['scope','response']))
    throw Error('SEO GSC daily comparison: strict pair required');

  const previous=analyzeOfflineGscDailySeries(
    input.previous.response,input.previous.scope);
  const current=analyzeOfflineGscDailySeries(
    input.current.response,input.current.scope);
  if(previous.tenantRef!==current.tenantRef||
    previous.propertyFingerprint!==current.propertyFingerprint)
    throw Error('SEO GSC daily comparison: mismatched tenant or property');
  const p=previous.period,c=current.period;
  if(p.requestedDays!==c.requestedDays||
    gscDay(p.endDate)>=gscDay(c.startDate))
    throw Error('SEO GSC daily comparison: equal non-overlapping periods required');

  const complete=computeCompleteness(previous)&&computeCompleteness(current);
  const clicksBefore=previous.summary.clicks,clicksAfter=current.summary.clicks;
  const impressionsBefore=previous.summary.impressions;
  const impressionsAfter=current.summary.impressions;
  const ctrBefore=previous.summary.ctr,ctrAfter=current.summary.ctr;
  const posBefore=previous.summary.weightedAveragePosition;
  const posAfter=current.summary.weightedAveragePosition;
  const signals=[];
  if(complete){
    if(impressionsBefore>=200&&impressionsAfter<impressionsBefore*.7)
      signals.push('review_impression_drop');
    if(clicksBefore>=20&&clicksAfter<clicksBefore*.75)
      signals.push('review_click_drop');
    if(impressionsBefore>=100&&impressionsAfter>=100&&ctrBefore-ctrAfter>=.02)
      signals.push('review_ctr_drop');
    if(impressionsBefore>=100&&impressionsAfter>=100&&
      posBefore!==null&&posAfter!==null&&posAfter-posBefore>=3)
      signals.push('review_average_position_decline');
  }
  return {
    contractVersion:'seo-gsc-daily-comparison-offline-v1',
    sourceType:'two_operator_supplied_date_exports_not_verified',
    tenantRef:previous.tenantRef,
    propertyFingerprint:previous.propertyFingerprint,
    periods:{
      previous:{startDate:p.startDate,endDate:p.endDate,
        returnedDays:p.returnedDays,unreturnedDays:p.unreturnedDays},
      current:{startDate:c.startDate,endDate:c.endDate,
        returnedDays:c.returnedDays,unreturnedDays:c.unreturnedDays}
    },
    comparisonDays:p.requestedDays,
    coverageStatus:complete?'COMPLETE_SUPPLIED_DATE_COVERAGE':'PARTIAL_DATA_NO_TREND_SIGNALS',
    coverageComplete:complete,
    previous:{clicks:clicksBefore,impressions:impressionsBefore,
      ctr:ctrBefore,weightedAveragePosition:posBefore},
    current:{clicks:clicksAfter,impressions:impressionsAfter,
      ctr:ctrAfter,weightedAveragePosition:posAfter},
    change:{
      clicksFraction:delta(clicksBefore,clicksAfter),
      impressionsFraction:delta(impressionsBefore,impressionsAfter),
      ctrPercentagePoints:complete?round((ctrAfter-ctrBefore)*100,2):null,
      averagePositionDifference:complete&&posBefore!==null&&posAfter!==null?
        round(posAfter-posBefore,2):null
    },
    reviewSignals:signals,
    oauthVerified:false,
    tenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_BACKEND_VERIFICATION',
    caveats:[
      'Coverage complete means supplied date rows span both windows, not that Google provided all search data.',
      'With missing dates or possible pagination, no drop or ranking review signal is emitted.',
      'Offline comparisons never authenticate a Google property, authorize publication or infer causality.'
    ]
  };
}
