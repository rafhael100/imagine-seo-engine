/**
 * SEO F131 — offline, read-only audit of legacy HTTPS/HTTP and www/apex
 * host signals in operator-supplied GSC PAGE rows. This is not a Google API
 * client, not evidence of current HTTP responses, and never emits page URLs.
 *
 * When any row contains private query/hash URL variants, all aggregate
 * metrics are withheld, not merely the sensitive row.
 */
import {canonicalProperty} from './gsc-readonly.mjs';
import {validateGscPeriod} from './gsc-period.mjs';
import {isStrictDataArray} from './gsc-strict-arrays.mjs';

const INPUT=['sourceType','property','canonicalOrigin','startDate','endDate',
  'dataState','dimensions','rows','hasMore'];
const ROW=['keys','clicks','impressions','ctr','position'];
const BUCKETS=Object.freeze([
  'canonicalHttps','canonicalHostHttp','alternateWwwHttps',
  'alternateWwwHttp','otherSubdomainHttps','otherSubdomainHttp'
]);
const metric=()=>({pageRows:0,clicks:0,impressions:0});
function exact(v,fields){
  if(!v||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function strictOrigin(value,domain){
  if(typeof value!=='string'||value.length>300||
     !/^https:\/\/[a-z0-9.-]+\/$/.test(value))throw Error('SEO F131: canonical HTTPS origin required');
  const url=new URL(value);
  if(url.href!==value||url.protocol!=='https:'||url.hostname.includes('..')||
     !(url.hostname===domain||url.hostname.endsWith('.'+domain)))
    throw Error('SEO F131: canonical origin not in declared property');
  return url;
}
function inspectPage(value,domain){
  if(typeof value!=='string'||value.length>2048||
     !/^https?:\/\/[^\s\\]+$/.test(value)||
     /[\u0000-\u001f\u007f]/.test(value)||value.includes('\\')||
     /%(?:2e|2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))
    throw Error('SEO F131: malformed operator page URL');
  let u;
  try{u=new URL(value);}catch{throw Error('SEO F131: malformed operator page URL');}
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||
     u.port||u.hostname.includes('..')||
     !(u.hostname===domain||u.hostname.endsWith('.'+domain))||
     u.href!==value || u.pathname.includes('//'))
    throw Error('SEO F131: URL outside trusted domain or unsafe');
  // Do not normalize or retain query/hash anywhere, including group keys.
  if(u.search||u.hash)return {redacted:true};
  return {redacted:false,protocol:u.protocol,host:u.hostname,path:u.pathname};
}
const validMetrics=row=>
  Number.isSafeInteger(row.clicks)&&row.clicks>=0&&
  Number.isSafeInteger(row.impressions)&&row.impressions>=0&&
  row.clicks<=row.impressions&&
  typeof row.ctr==='number'&&Number.isFinite(row.ctr)&&
  row.ctr>=0&&row.ctr<=1&&
  (row.impressions===0?row.ctr===0:
    Math.abs(row.ctr-row.clicks/row.impressions)<=0.02)&&
  typeof row.position==='number'&&Number.isFinite(row.position)&&
  row.position>=1&&row.position<=1000;
function categorize(url,canonical,other){
  if(url.host===canonical.hostname)
    return url.protocol==='https:'?'canonicalHttps':'canonicalHostHttp';
  if(url.host===other)
    return url.protocol==='https:'?'alternateWwwHttps':'alternateWwwHttp';
  return url.protocol==='https:'?'otherSubdomainHttps':'otherSubdomainHttp';
}
/** Input is original read-only GSC PAGE export shape, never a cached summary. */
export function reviewOfflineGscPageOrigins(input){
  if(!exact(input,INPUT)||input.sourceType!=='operator_supplied_gsc_pages_unverified'||
     input.dataState!=='final'||typeof input.hasMore!=='boolean'||
     !isStrictDataArray(input.dimensions,1)||
     input.dimensions.length!==1||input.dimensions[0]!=='page'||
     !isStrictDataArray(input.rows,5000)||input.rows.length===0)
    throw Error('SEO F131: bounded original page export required');
  const property=canonicalProperty(input.property);
  if(!property.startsWith('sc-domain:'))
    throw Error('SEO F131: domain-property evidence required');
  const domain=property.slice(10);
  const canonical=strictOrigin(input.canonicalOrigin,domain);
  const period=validateGscPeriod(input.startDate,input.endDate);
  const alternate=canonical.hostname.startsWith('www.')
    ?canonical.hostname.slice(4):'www.'+canonical.hostname;
  const rows=[];
  const seen=new Set();
  let redactedRows=0;
  for(const row of input.rows){
    if(!exact(row,ROW)||!isStrictDataArray(row.keys,1)||
       row.keys.length!==1||!validMetrics(row))
      throw Error('SEO F131: invalid original page row');
    const page=inspectPage(row.keys[0],domain);
    // Duplicated URL rows are suspicious even if private and redacted.
    if(seen.has(row.keys[0]))
      throw Error('SEO F131: duplicate original page row');
    seen.add(row.keys[0]);
    if(page.redacted){redactedRows++;continue;}
    const bucket=categorize(page,canonical,alternate);
    rows.push({bucket,path:page.path,origin:page.protocol+'//'+page.host,
      clicks:row.clicks,impressions:row.impressions});
  }
  const safe={
    contractVersion:'seo-gsc-page-origin-parity-offline-v1',
    sourceType:'operator_supplied_gsc_pages_unverified',
    period:{startDate:period.startDate,endDate:period.endDate},
    reviewStatus:redactedRows>0?'METRICS_WITHHELD_PRIVATE_URLS':'HUMAN_CANONICAL_REVIEW_REQUIRED',
    coverageStatus:input.hasMore?'PAGINATION_REMAINS':'SUPPLIED_ROWS_ONLY',
    summary:{receivedRows:input.rows.length,redactedRows,
      ...(redactedRows>0?{
        originBuckets:null,noncanonicalImpressions:null,
        noncanonicalClicks:null,noncanonicalImpressionShare:null,
        logicalPathsWithMultipleOrigins:null,homeOriginVariants:null
      }:(()=>{
        const totals=Object.fromEntries(BUCKETS.map(k=>[k,metric()]));
        const originPaths=new Map();
        const home=new Set();
        let allImpressions=0,noncanonicalImpressions=0,noncanonicalClicks=0;
        for(const row of rows){
          const bucket=totals[row.bucket];
          bucket.pageRows++;bucket.clicks+=row.clicks;
          bucket.impressions+=row.impressions;allImpressions+=row.impressions;
          if(row.bucket!=='canonicalHttps'){
            noncanonicalImpressions+=row.impressions;
            noncanonicalClicks+=row.clicks;
          }
          if(!originPaths.has(row.path))originPaths.set(row.path,new Set());
          originPaths.get(row.path).add(row.origin);
          if(row.path==='/')home.add(row.origin);
        }
        const groups=[...originPaths.values()].filter(v=>v.size>1).length;
        return {originBuckets:totals,noncanonicalImpressions,
          noncanonicalClicks,
          noncanonicalImpressionShare:allImpressions?
            Math.round(10000*noncanonicalImpressions/allImpressions)/10000:0,
          logicalPathsWithMultipleOrigins:groups,homeOriginVariants:home.size
        };
      })())
    },
    reviewSignals:[],
    oauthVerified:false,
    tenantPropertyGrantVerified:false,
    liveHttpRedirectVerified:false,
    productionCanonicalVerified:false,
    queryCompletenessVerified:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_GSC_AUTHORIZATION_HTTP_REDIRECT_AND_HUMAN_REVIEW'
  };
  if(redactedRows===0){
    if(safe.summary.originBuckets.canonicalHostHttp.pageRows+
       safe.summary.originBuckets.alternateWwwHttp.pageRows+
       safe.summary.originBuckets.otherSubdomainHttp.pageRows>0)
      safe.reviewSignals.push('review_http_legacy_index_signals');
    if(safe.summary.originBuckets.alternateWwwHttps.pageRows+
       safe.summary.originBuckets.alternateWwwHttp.pageRows>0)
      safe.reviewSignals.push('review_www_apex_canonical_consistency');
    if(safe.summary.logicalPathsWithMultipleOrigins>0)
      safe.reviewSignals.push('review_same_path_across_origins');
    if(safe.summary.homeOriginVariants>1)
      safe.reviewSignals.push('review_homepage_origin_variants');
  }
  return safe;
}
