/**
 * SEO-F105 — compares two independently revalidated operator-supplied
 * OpenSEO/GSC date-only snapshots, without network or provider identity.
 *
 * A full set of submitted dates is NOT proof of source completeness. This
 * offline review never emits automated drop/ranking alerts or grants access.
 */
import {reviewOfflineOpenSeoDailySnapshot} from './openseo-daily-bridge.mjs';
import {gscDay} from './gsc-period.mjs';

function strictPair(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const fields=Reflect.ownKeys(value);
  return fields.length===2&&fields.includes('previous')&&
    fields.includes('current')&&fields.every(field=>
      typeof field==='string'&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(value,field),'value')&&
      Object.getOwnPropertyDescriptor(value,field).enumerable);
}
const round=(n,places=2)=>Math.round(n*10**places)/10**places;
const pctChange=(a,b)=>a===0?null:round((b-a)*100/a,2);

export function compareOfflineOpenSeoDailyPeriods(input){
  if(!strictPair(input))
    throw Error('SEO F105: exact pair of snapshots required');

  // Validate original submitted snapshots, not caller-supplied review DTOs.
  const previous=reviewOfflineOpenSeoDailySnapshot(input.previous);
  const current=reviewOfflineOpenSeoDailySnapshot(input.current);
  if(previous.tenantRef!==current.tenantRef||
    previous.propertyFingerprint!==current.propertyFingerprint)
    throw Error('SEO F105: tenant or property mismatch');

  const p=previous.period,c=current.period;
  // Adjacent, equally long windows avoid comparing overlapping or arbitrary
  // periods and suppress misleading changes from calendar gaps.
  if(p.requestedDays!==c.requestedDays||
    gscDay(p.endDate)+1!==gscDay(c.startDate))
    throw Error('SEO F105: adjacent equal-length periods required');

  const fullSubmittedDateCoverage=p.unreturnedDays===0&&c.unreturnedDays===0;
  const a=previous.summary,b=current.summary;
  return {
    contractVersion:'seo-openseo-daily-comparison-offline-v1',
    sourceType:'two_operator_supplied_openseo_snapshots_not_provider_verified',
    tenantRef:previous.tenantRef,
    propertyFingerprint:previous.propertyFingerprint,
    periods:{
      previous:p,current:c
    },
    comparisonDays:p.requestedDays,
    coverageStatus:fullSubmittedDateCoverage?
      'ALL_DATES_SUBMITTED_ORIGIN_UNVERIFIED':
      'PARTIAL_SUBMITTED_DATES_NO_COMPARISON',
    submittedDateCoverageComplete:fullSubmittedDateCoverage,
    sourceCompletenessNotProven:true,
    metrics:{previous:a,current:b},
    change:{
      clicksPercent:fullSubmittedDateCoverage?pctChange(a.clicks,b.clicks):null,
      impressionsPercent:fullSubmittedDateCoverage?
        pctChange(a.impressions,b.impressions):null,
      ctrPercentagePoints:fullSubmittedDateCoverage?
        round((b.ctr-a.ctr)*100):null,
      averagePositionDifference:fullSubmittedDateCoverage&&
        a.weightedAveragePosition!==null&&
        b.weightedAveragePosition!==null?
        round(b.weightedAveragePosition-a.weightedAveragePosition):null
    },
    reviewSignals:[], // Never claim a provider-confirmed alert from local JSON.
    oauthVerifiedForImagine:false,
    portalTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_IMAGINE_BACKEND_AUTHORIZATION',
    caveats:[
      'Date coverage counts only submitted rows; it does not prove Google/OpenSEO source completeness.',
      'Missing dates are unknown, never zero; partial periods suppress every difference.',
      'Comparisons are exploratory only and cannot trigger an automated ranking or traffic alert.',
      'Imagine Portal still requires authenticated tenant/property grants, consent, OAuth, and independent review.'
    ]
  };
}
