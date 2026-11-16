/**
 * SEO F130 — check an operator-supplied GA4 configuration snapshot for
 * Imagine's Visitas -> Leads -> Clientes measurement readiness.
 *
 * This NEVER treats GSC clicks as sessions, GA4 "purchase" as CRM customers,
 * configured event names as proof of event firing, or unverified metadata
 * as authenticated Google state. No provider API, network or PII.
 */
const MAX_EVENTS=100, EVENT=/^[a-z][a-z0-9_]{0,39}$/;
function exact(value,fields){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(value,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function dense(v){
  if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||
     v.length>MAX_EVENTS||Reflect.ownKeys(v).length!==v.length+1)return false;
  for(let i=0;i<v.length;i++){
    const d=Object.getOwnPropertyDescriptor(v,String(i));
    if(!d?.enumerable||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
export function reviewGa4FunnelKeyEventReadiness(input){
  if(!exact(input,['sourceType','webStreamCount','keyEventNames'])||
     input.sourceType!=='operator_supplied_ga4_configuration_unverified'||
     !Number.isSafeInteger(input.webStreamCount)||input.webStreamCount<0||
     input.webStreamCount>50||!dense(input.keyEventNames))
    throw Error('SEO F130: invalid offline measurement configuration');

  const names=new Set();
  for(const name of input.keyEventNames){
    if(typeof name!=='string'||!EVENT.test(name)||names.has(name))
      throw Error('SEO F130: invalid bounded GA4 event name');
    names.add(name);
  }
  const webStreamConfigured=input.webStreamCount>0;
  const leadKeyEventConfigured=names.has('generate_lead');
  const purchaseKeyEventConfigured=names.has('purchase');
  const reviewSignals=[];
  if(!webStreamConfigured)reviewSignals.push('web_stream_not_reported');
  if(!leadKeyEventConfigured)reviewSignals.push('generate_lead_key_event_missing');
  if(purchaseKeyEventConfigured)
    reviewSignals.push('purchase_not_authoritative_crm_customer_conversion');
  // A declared event is not proof that it fires. There is no CRM authority.
  reviewSignals.push('verified_crm_lead_and_customer_events_required');
  return {
    contractVersion:'seo-ga4-funnel-measurement-preflight-offline-v1',
    methodology:'VISITAS_LEADS_CLIENTES',
    sourceType:'operator_supplied_ga4_configuration_unverified',
    reviewStatus:!webStreamConfigured||!leadKeyEventConfigured?
      'configuration_corrections_required':'independent_measurement_review_required',
    summary:{
      reportedWebStreams:input.webStreamCount,
      reportedKeyEvents:names.size,
      webStreamConfigured,
      generateLeadKeyEventConfigured:leadKeyEventConfigured,
      purchaseKeyEventConfigured,
      unresolvedRequirements:reviewSignals.length
    },
    reviewSignals,
    // No analytics sessions or leads/clients counts may be manufactured here.
    stages:[
      {name:'VISITAS',metric:'ga4_sessions',value:null,
        status:'SOURCE_NOT_AUTHENTICATED_IN_ENGINE'},
      {name:'LEADS',metric:'crm_attributed_leads',value:null,
        status:'CRM_ATTRIBUTION_NOT_VERIFIED'},
      {name:'CLIENTES',metric:'crm_won_customers',value:null,
        status:'CRM_CUSTOMER_EVENTS_NOT_VERIFIED'}
    ],
    conversionRates:{visitsToLeads:null,leadsToCustomers:null,visitsToCustomers:null},
    googlePropertyVerifiedInEngine:false,
    realEventDeliveryVerified:false,
    privacyConsentVerified:false,
    crmTenantAuthorizationVerified:false,
    customerConversionVerified:false,
    productionMetricsAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_GOOGLE_GA4_EVENTS_CRM_AUTHORIZATION_AND_CONSENT'
  };
}
