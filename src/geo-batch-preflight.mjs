/**
 * SEO-F107 — conservative, bounded batch preflight of *draft* municipal
 * service pages. No IBGE lookup, Google calls, publishing, ranking claims,
 * automatic generation, indexing or customer access.
 */
import {evaluateGeoCandidate} from './geographic-quality.mjs';

const CANDIDATE_FIELDS=[
  'serviceSlug','ibgeCode','city','state','availabilityConfirmed',
  'reasonForLocalPage','localContent','demandEvidence'
];
const EXISTING_FIELDS=['serviceSlug','ibgeCode','city','state','localContent'];
const EVIDENCE_FIELDS=['source','observedAt','explanation'];

function exact(value,fields){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===fields.length &&
    keys.every(k=>typeof k==='string' && fields.includes(k) &&
      Object.getOwnPropertyDescriptor(value,k)?.enumerable===true &&
      Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value'));
}
function boundedArray(value,max,min=0){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||
    value.length<min||value.length>max)return false;
  const keys=Reflect.ownKeys(value);
  if(keys.length!==value.length+1)return false;
  for(let i=0;i<value.length;i++){
    const d=Object.getOwnPropertyDescriptor(value,String(i));
    if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
const short=(s,max)=>typeof s==='string'&&s.length<=max;
function candidateValid(value){
  return exact(value,CANDIDATE_FIELDS)&&
    short(value.serviceSlug,100)&&short(value.ibgeCode,7)&&
    short(value.city,120)&&short(value.state,2)&&
    typeof value.availabilityConfirmed==='boolean'&&
    short(value.reasonForLocalPage,3000)&&
    short(value.localContent,8000)&&
    boundedArray(value.demandEvidence,20)&&
    value.demandEvidence.every(x=>
      exact(x,EVIDENCE_FIELDS)&&short(x.source,40)&&
      short(x.observedAt,10)&&short(x.explanation,3000));
}
function existingValid(value){
  return exact(value,EXISTING_FIELDS)&&
    short(value.serviceSlug,100)&&short(value.ibgeCode,7)&&
    short(value.city,120)&&short(value.state,2)&&
    short(value.localContent,8000);
}

/**
 * A batch helps editors identify potentially repetitive doorway pages.
 * The supplied existing set is bounded and NOT a verified complete index;
 * even a clean batch requires independent global duplicate checks.
 */
export function reviewMunicipalSeoDraftBatch(input){
  if(!exact(input,['candidates','existing','maxSimilarity']) ||
    !boundedArray(input.candidates,25,1) ||
    !boundedArray(input.existing,250) ||
    !Number.isFinite(input.maxSimilarity) ||
    input.maxSimilarity<0.1||input.maxSimilarity>0.95 ||
    !input.candidates.every(candidateValid) ||
    !input.existing.every(existingValid))
    throw Error('SEO F107: invalid bounded editorial input');

  const previous=[...input.existing];
  const items=input.candidates.map((candidate,index)=>{
    const result=evaluateGeoCandidate(
      candidate,previous,{maxSimilarity:input.maxSimilarity}
    );
    // Include all reviewed drafts, including blocked ones, to catch near
    // duplicates within this batch. This still cannot prove global uniqueness.
    previous.push({
      serviceSlug:candidate.serviceSlug,ibgeCode:candidate.ibgeCode,
      city:candidate.city,state:candidate.state,
      localContent:candidate.localContent
    });
    return {
      draftIndex:index,
      reviewStatus:result.status,
      reasons:[...result.reasons],
      maximumLocalSimilarity:result.largestContentSimilarity,
      publishAllowed:false,
      indexingAllowed:false
    };
  });
  const blocked=items.filter(x=>x.reviewStatus==='blocked').length;
  return {
    contractVersion:'seo-municipal-batch-editorial-offline-v1',
    sourceType:'operator_supplied_drafts_and_partial_existing_pages_unverified',
    methodology:'batch_local_quality_and_3gram_similarity',
    summary:{
      suppliedDrafts:items.length,
      suppliedExistingPages:input.existing.length,
      blockedDrafts:blocked,
      awaitingHumanReview:items.length-blocked
    },
    items,
    ibgeMunicipalityCodesVerified:false,
    localAvailabilityIndependentlyVerified:false,
    searchDemandIndependentlyVerified:false,
    completeNationalDuplicationCheckPerformed:false,
    automatedPageGeneration:false,
    automatedPublication:false,
    indexingAllowed:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_HUMAN_EDITORIAL_IBGE_AND_SITE_GATES',
    limitations:[
      'The supplied existing-page list may be incomplete; this is not a national duplicate-content guarantee.',
      'Passing a local content check does not validate IBGE municipality identifiers, search demand or actual local service availability.',
      'No published URL, sitemap, indexation, search ranking, customer lead or conversion is created by this preflight.'
    ]
  };
}
