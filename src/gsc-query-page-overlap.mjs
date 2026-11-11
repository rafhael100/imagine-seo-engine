/**
 * SEO-F57 — Review competing query/page matches in offline GSC exports.
 * No raw query, URL, search term hash, account or token is ever emitted.
 * Multiple pages per query are evidence of overlap, NOT proof of a problem.
 */
import {createHash} from 'node:crypto';
import {canonicalProperty} from './gsc-readonly.mjs';
import {validateGscPeriod} from './gsc-period.mjs';

const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const HEX=/^[0-9a-f]{64}$/;
const CONFIG=new Set(['tenantRef','siteUrl','propertyFingerprint',
  'startDate','endDate','rowLimit']);
const RESPONSE=new Set(['rows','responseAggregationType','metadata']);
const ROW=new Set(['keys','clicks','impressions','ctr','position']);
const privateQuery=/@|(?:\+?\d[\d() -]{7,}\d)|(?:cpf|cnpj)\s*[:=]?\s*\d/i;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(value));
const keys=(value,allowed,required=false)=>{
  if(!plain(value))return false;
  const own=Reflect.ownKeys(value);
  return (!required||own.length===allowed.size)&&own.every(k=>
    typeof k==='string'&&allowed.has(k)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value'));
};
function propertyPageAllowed(value,property){
  if(typeof value!=='string'||value.length>2048||/[\r\n\0]/.test(value))
    return false;
  let url;
  try {url=new URL(value);}catch{return false;}
  if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search||
    url.port || !/^[a-z0-9.-]+$/i.test(url.hostname))return false;
  if(property.startsWith('sc-domain:')){
    const domain=property.slice('sc-domain:'.length);
    return url.hostname===domain||url.hostname.endsWith('.'+domain);
  }
  return url.href.startsWith(property);
}

export function reviewOfflineGscQueryPageOverlap(response,scope){
  if(!keys(scope,CONFIG)||!keys(response,RESPONSE)||
    !Object.hasOwn(response,'rows')||!Array.isArray(response.rows))
    throw Error('SEO GSC overlap: unsupported input');
  const {tenantRef,siteUrl,propertyFingerprint,startDate,endDate,rowLimit=1000}=scope;
  if(typeof tenantRef!=='string'||!TENANT.test(tenantRef)||
    typeof propertyFingerprint!=='string'||!HEX.test(propertyFingerprint)||
    !Number.isSafeInteger(rowLimit)||rowLimit<1||rowLimit>1000)
    throw Error('SEO GSC overlap: invalid operator scope');
  let property;
  try {property=canonicalProperty(siteUrl);validateGscPeriod(startDate,endDate);}
  catch {throw Error('SEO GSC overlap: invalid property or period');}
  if(createHash('sha256').update(property).digest('hex')!==propertyFingerprint)
    throw Error('SEO GSC overlap: property fingerprint mismatch');
  if(response.rows.length>rowLimit)
    throw Error('SEO GSC overlap: rowLimit exceeded');
  if(response.responseAggregationType!==undefined&&
    response.responseAggregationType!=='byPage')
    throw Error('SEO GSC overlap: unsupported aggregation');
  if(response.metadata!==undefined&&(!plain(response.metadata)||
    Reflect.ownKeys(response.metadata).length!==0))
    throw Error('SEO GSC overlap: incomplete or unexpected provider metadata');

  const seenPairs=new Set();
  const buckets=new Map();
  let redactedRows=0,validRows=0,previousClicks=Infinity;
  for(const row of response.rows){
    if(!keys(row,ROW,true)||!Array.isArray(row.keys)||row.keys.length!==2||
      typeof row.keys[0]!=='string'||typeof row.keys[1]!=='string'||
      !propertyPageAllowed(row.keys[1],property)||
      !Number.isSafeInteger(row.clicks)||row.clicks<0||
      !Number.isSafeInteger(row.impressions)||row.impressions<0||
      row.clicks>row.impressions||row.clicks>previousClicks||
      typeof row.ctr!=='number'||!Number.isFinite(row.ctr)||row.ctr<0||
      row.ctr>1||
      (row.impressions===0&&row.ctr!==0)||
      (row.impressions>0&&Math.abs(row.ctr-row.clicks/row.impressions)>0.02)||
      typeof row.position!=='number'||!Number.isFinite(row.position)||
      row.position<1)
      throw Error('SEO GSC overlap: invalid query/page row');
    previousClicks=row.clicks;
    const query=row.keys[0].trim();
    if(!query||query.length>500)
      throw Error('SEO GSC overlap: invalid query');
    if(privateQuery.test(query)){redactedRows++;continue;}
    const pair=JSON.stringify([query.toLocaleLowerCase('pt-BR'),row.keys[1]]);
    if(seenPairs.has(pair))throw Error('SEO GSC overlap: duplicated query/page pair');
    seenPairs.add(pair);
    validRows++;
    const key=query.toLocaleLowerCase('pt-BR');
    const prior=buckets.get(key)||{pages:new Set(),impressions:0,clicks:0};
    prior.pages.add(row.keys[1]);
    prior.impressions+=row.impressions;
    prior.clicks+=row.clicks;
    if(!Number.isSafeInteger(prior.impressions)||!Number.isSafeInteger(prior.clicks))
      throw Error('SEO GSC overlap: metric overflow');
    buckets.set(key,prior);
  }
  let overlappingQueries=0,overlappingPages=0,overlapImpressions=0;
  for(const record of buckets.values()){
    if(record.pages.size>1){
      overlappingQueries++;
      overlappingPages+=record.pages.size;
      overlapImpressions+=record.impressions;
      if(!Number.isSafeInteger(overlapImpressions))
        throw Error('SEO GSC overlap: metric overflow');
    }
  }
  const possiblyTruncated=response.rows.length===rowLimit;
  return {
    contractVersion:'seo-gsc-query-page-overlap-offline-v1',
    sourceType:'operator_supplied_query_page_response_not_verified',
    tenantRef,propertyFingerprint,
    period:{startDate,endDate},
    summary:{
      receivedRows:response.rows.length,
      redactedRows,
      analyzedRows:validRows,
      distinctQueries:buckets.size,
      queriesOnMultiplePages:overlappingQueries,
      totalPagesAcrossOverlappingQueries:overlappingPages,
      impressionsOnOverlappingQueries:overlapImpressions,
      possibleTruncation:possiblyTruncated
    },
    reviewStatus:possiblyTruncated?'PARTIAL_COVERAGE_REVIEW_ONLY':
      overlappingQueries>0?'POSSIBLE_QUERY_PAGE_OVERLAP_REVIEW':
        'NO_OVERLAP_IN_SUPPLIED_ROWS',
    oauthVerified:false,
    tenantGrantVerified:false,
    customerDisplayAuthorized:false,
    productionReadAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EXTERNAL_BACKEND_VERIFICATION',
    caveats:[
      'A query matching multiple pages is not proof of cannibalization or incorrect canonical signals.',
      'Anonymized queries and pagination may omit matches; this report covers supplied rows only.',
      'No terms, URLs or reversible query identifiers are returned or persisted.'
    ]
  };
}
