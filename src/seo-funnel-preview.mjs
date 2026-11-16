/**
 * SEO-F106 — review-only boundary for Imagine's Visitas -> Leads -> Clientes.
 *
 * SEO GSC clicks are NOT web analytics visits, a lead, or a customer.
 * This view model accepts two ORIGINAL F104 operator snapshots, revalidates
 * them through F105 and never accepts CRM or authorization claims as input.
 *
 * No network, no tenancy claims, no guessed conversions, no production access.
 */
import {compareOfflineOpenSeoDailyPeriods}
  from './openseo-daily-compare.mjs';

const ALLOWED=new Set(['comparisonInput']);
function exactData(value,expected){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===expected.size&&keys.every(key=>
    typeof key==='string'&&expected.has(key)&&
    Object.getOwnPropertyDescriptor(value,key)?.enumerable===true&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'));
}
const stage=(name,metric,source,reason)=>({
  name,metric,value:null,availability:'NOT_AVAILABLE',
  requiredSource:source,reason
});

export function prepareOfflineSeoFunnelPreview(input){
  if(!exactData(input,ALLOWED))
    throw Error('SEO F106: original comparison input required');

  // Never consume caller-provided F105 summaries, status or a pretend grant.
  const reviewed=compareOfflineOpenSeoDailyPeriods(input.comparisonInput);
  const complete=reviewed.submittedDateCoverageComplete===true;
  const current=reviewed.metrics.current;
  return {
    contractVersion:'seo-visitas-leads-clientes-preview-offline-v1',
    methodology:'VISITAS_LEADS_CLIENTES',
    sourceType:'operator_supplied_gsc_snapshots_not_provider_verified',
    scope:{
      tenantRef:reviewed.tenantRef,
      propertyFingerprint:reviewed.propertyFingerprint
    },
    period:reviewed.periods.current,
    // These are SEARCH CONSOLE observations, not site-visit metrics.
    organicSearchDiscovery:complete?{
      source:'manual_unverified_gsc_date_rows',
      clicks:current.clicks,
      impressions:current.impressions,
      ctr:current.ctr,
      weightedAveragePosition:current.weightedAveragePosition,
      clicksChangePercent:reviewed.change.clicksPercent,
      impressionsChangePercent:reviewed.change.impressionsPercent,
      dataCaveat:'SUBMITTED_DATES_ONLY_NOT_PROVIDER_VERIFIED'
    }:null,
    organicSearchDiscoveryStatus:complete?
      'SUBMITTED_DATES_ONLY_ORIGIN_UNVERIFIED':
      'PARTIAL_DATES_WITHHELD',
    stages:[
      stage('VISITAS','analytics_sessions','authorized_web_analytics',
        'Search Console clicks do not establish visits or sessions.'),
      stage('LEADS','attributed_crm_leads','authorized_crm_lead_events',
        'A search click does not establish a recorded lead.'),
      stage('CLIENTES','attributed_crm_customers','authorized_crm_customer_events',
        'A lead or search click does not establish a won customer.')
    ],
    conversionRates:{
      visitsToLeads:null,
      leadsToCustomers:null,
      visitsToCustomers:null
    },
    sourceCompletenessNotProven:true,
    requiresIndependentTenantPropertyGrant:true,
    requiresVerifiedWebAnalytics:true,
    requiresAuthorizedCrmAttribution:true,
    oauthVerifiedForImagine:false,
    portalTenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    reviewSignals:[],
    releaseStatus:'HOLD_IMAGINE_BACKEND_AUTHORIZATION',
    caveats:[
      'Search Console impressions and clicks must never be labeled as site visits or CRM conversions.',
      'Visits, leads and customers are unavailable without their own authenticated sources.',
      'Search observations are derived only from locally supplied date rows; even complete dates do not prove provider coverage.',
      'This preview does not supply an attribution model, customer identity, permission or publication authorization.'
    ]
  };
}
