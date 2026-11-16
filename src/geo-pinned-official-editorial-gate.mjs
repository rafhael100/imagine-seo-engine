/**
 * SEO F179 — bind municipal editorial drafts to the actual DTB 2025
 * normalized source receipt (F172), reusing F156 and F107 validations.
 * No provider API, publication, local service or search demand claims.
 */
import {createHash} from 'node:crypto';
import {parseNormalizedDtb2025Csv} from './ibge-independent-dtb-crosscheck.mjs';
import {reviewMunicipalSeoDraftBatch} from './geo-batch-preflight.mjs';

export const OFFICIAL_DTB_2025_NORMALIZED_SHA256=
 '039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818';
const SPECIAL=new Set(['5300108','2605459']);
const own=(v,k)=>Object.hasOwn(v,k);
function exact(value,fields){
 return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
   [Object.prototype,null].includes(Object.getPrototypeOf(value))&&
   Reflect.ownKeys(value).length===fields.length&&
   fields.every(k=>own(value,k)&&
    Object.getOwnPropertyDescriptor(value,k)?.enumerable===true&&
    own(Object.getOwnPropertyDescriptor(value,k),'value'));
}
const name=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLocaleLowerCase('pt-BR').replace(/[’‘]/g,"'")
 .replace(/\s+/g,' ').trim();

// F182: this public laboratory helper accepts a Map, but a Map subclass or
// an accessor-bearing row must never execute caller code while looking up
// official-looking names. The production wrapper still pins exact CSV bytes.
function reviewedRowMap(rows){
 if(!(rows instanceof Map)||Object.getPrototypeOf(rows)!==Map.prototype||
    rows.size===0||rows.size>5571)return false;
 for(const [code,row] of rows){
  if(typeof code!=='string'||!/^\d{7}$/.test(code)||
     row===null||typeof row!=='object'||Array.isArray(row)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(row)))return false;
  const keys=Reflect.ownKeys(row);
  if((keys.length!==2&&keys.length!==3)||
     keys.some(key=>!['state','city','index'].includes(key)))return false;
  for(const key of ['state','city',...(keys.length===3?['index']:[])]){
   const descriptor=Object.getOwnPropertyDescriptor(row,key);
   if(descriptor?.enumerable!==true||!Object.hasOwn(descriptor,'value'))
    return false;
  }
  const state=Object.getOwnPropertyDescriptor(row,'state').value;
  const city=Object.getOwnPropertyDescriptor(row,'city').value;
  if(typeof state!=='string'||!/^[A-Z]{2}$/.test(state)||
     typeof city!=='string'||city.length<2||city.length>120||
     /[\x00-\x1f\x7f<>]/.test(city))return false;
  if(keys.length===3){
   const index=Object.getOwnPropertyDescriptor(row,'index').value;
   if(!Number.isSafeInteger(index)||index<0||index>5570)return false;
  }
 }
 return true;
}

/**
 * The input batch must first pass the original F107 contract. No batch
 * payload or name is serialized in the result. This helper is also used
 * by synthetic unit tests, but DOES NOT establish source provenance.
 */
export function compareDraftBatchToDtbRows({draftBatchInput,rows}={}){
 if(!reviewedRowMap(rows))
  throw Error('F179: safe official row map required');
 // Recompute original editorial gate; never accept self-reported approvals.
 const batch=reviewMunicipalSeoDraftBatch(draftBatchInput);
 const entries=draftBatchInput.candidates;
 const reviews=[];let matched=0,specials=0,blocked=0;
 for(let i=0;i<entries.length;i++){
  const candidate=entries[i],item=batch.items[i];
  if(!candidate||typeof candidate.ibgeCode!=='string'||
     !item||item.draftIndex!==i||!Array.isArray(item.reasons))
   throw Error('F179: forged original draft review');
  const official=rows.get(candidate.ibgeCode);
  const reasons=[...item.reasons];
  if(!official)reasons.push('municipality_code_not_in_pinned_official_dtb');
  else {
   matched++;
   if(official.state!==candidate.state)
    reasons.push('municipality_uf_differs_from_pinned_official_dtb');
   if(name(official.city)!==name(candidate.city))
    reasons.push('municipality_name_differs_from_pinned_official_dtb');
  }
  if(SPECIAL.has(candidate.ibgeCode)){
   specials++;
   reasons.push('special_territorial_unit_not_ordinary_municipality');
  }
  const unique=[...new Set(reasons)];
  if(unique.length)blocked++;
  reviews.push(Object.freeze({
   draftIndex:i,status:unique.length?'blocked':'human_editorial_review_required',
   reasons:Object.freeze(unique),publicationAuthorized:false,
   indexingAuthorized:false
  }));
 }
 return Object.freeze({
  contractVersion:'seo-f179-source-bound-municipal-editorial-v1',
  examinedDrafts:entries.length,
  matchedOfficialDtbCodes:matched,
  specialTerritorialDrafts:specials,
  blockedDrafts:blocked,
  awaitingHumanEditorialReview:entries.length-blocked,
  reviews:Object.freeze(reviews),
  publicationAuthorized:false,indexingAuthorized:false,
  tenantServiceCoverageVerified:false,localSearchDemandVerified:false,
  editorialContentIndependentlyApproved:false,
  networkPerformed:false,
  releaseStatus:'HOLD_OFFICIAL_EDITORIAL_SERVICE_AND_HUMAN_RELEASE'
 });
}

/** Verify byte-for-byte normalized source against the pinned F172 SHA. */
export function reviewDraftBatchAgainstPinnedDtb(input){
 if(!exact(input,['normalizedDtbCsv','draftBatchInput'])||
   typeof input.normalizedDtbCsv!=='string'|| 
   Buffer.byteLength(input.normalizedDtbCsv,'utf8')>1024*1024)
  throw Error('F179: original normalized DTB and draft inputs required');
 const digest=createHash('sha256').update(input.normalizedDtbCsv,'utf8').digest('hex');
 if(digest!==OFFICIAL_DTB_2025_NORMALIZED_SHA256)
  throw Error('F179: source bytes do not match authenticated F172 receipt');
 const dtb=parseNormalizedDtb2025Csv(input.normalizedDtbCsv);
 if(dtb.rows.size!==5571||dtb.specials!==2)
  throw Error('F179: incomplete official 2025 territorial roster');
 return Object.freeze({
  ...compareDraftBatchToDtbRows({draftBatchInput:input.draftBatchInput,rows:dtb.rows}),
  officialDtbCsvShaPinned:true,
  officialDtbRows:dtb.rows.size,
  knownSpecialTerritorialUnits:dtb.specials,
  independentAreaProductComparedInThisReview:false,
  originalDtbWorkbookNotTransferred:true
 });
}
