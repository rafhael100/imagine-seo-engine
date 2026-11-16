/**
 * F168 — scale a conservative exact city-substitution content check to an
 * operator-supplied national editorial inventory, without outputting content.
 * No near-duplicate, source-authenticity or SEO release claim is made.
 */
import {createHash} from 'node:crypto';
const MAX=6000;
const STATES=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA=/^[0-9]{7}$/;
const fields=['serviceSlug','ibgeCode','city','state','locale','localContent'];
const own=(value,k)=>Object.prototype.hasOwnProperty.call(value,k);
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 [Object.prototype,null].includes(Object.getPrototypeOf(v))&&
 Reflect.ownKeys(v).length===keys.length&&keys.every(k=>own(v,k)&&
  Object.getOwnPropertyDescriptor(v,k)?.enumerable===true&&
  own(Object.getOwnPropertyDescriptor(v,k),'value'));
// F181: never iterate an untrusted editorial array before validating its
// own indexed data descriptors. Array.every() would invoke accessor getters
// and silently skip holes (which could be masked by custom fields).
const dense=(items)=>{
 if(!Array.isArray(items)||Object.getPrototypeOf(items)!==Array.prototype||
    items.length===0||items.length>MAX||
    Reflect.ownKeys(items).length!==items.length+1)return false;
 for(let i=0;i<items.length;i++){
  const descriptor=Object.getOwnPropertyDescriptor(items,String(i));
  if(descriptor?.enumerable!==true||
     !Object.hasOwn(descriptor,'value'))return false;
 }
 return true;
};
const clean=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const wordPattern=word=>new RegExp('(?:^| )'+word.split(' ').join(' ')+ '(?= |$)','g');
function template(text,city,state){
 const body=clean(text),place=clean(city);
 if(!body||!place)throw Error('F168: valid private editorial text required');
 // First remove city + UF, then standalone city; never drop arbitrary
 // state abbreviations in the rest of the copy.
 let normalized=body.replace(wordPattern(place+' '+state.toLowerCase()),' localidade');
 normalized=normalized.replace(wordPattern(place),' localidade');
 return normalized.replace(/\s+/g,' ').trim();
}
export function reviewNationalCityTemplateInventory(input){
 if(!exact(input,['sourceType','entries'])||
   input.sourceType!=='operator_supplied_private_editorial_text_unverified'||
   !dense(input.entries))throw Error('F168: bounded private editorial inventory required');
 const seenKeys=new Map(),seenContent=new Map(),hits=[];
 let distinctServices=new Set(),duplicateKeys=0,templatedAcrossCities=0;
 let textLength=0;
 for(let i=0;i<input.entries.length;i++){
  const e=input.entries[i];
  if(!exact(e,fields)||typeof e.serviceSlug!=='string'||e.serviceSlug.length>72||
    !SLUG.test(e.serviceSlug)||typeof e.ibgeCode!=='string'||!SHA.test(e.ibgeCode)||
    typeof e.city!=='string'||e.city.length<2||e.city.length>120||
    typeof e.state!=='string'||!STATES.has(e.state)||
    !['pt-BR','en-US','es-ES'].includes(e.locale)||
    typeof e.localContent!=='string'||e.localContent.length<160||
    e.localContent.length>8000)throw Error('F168: invalid private editorial entry');
  textLength+=e.localContent.length;
  if(textLength>20_000_000)throw Error('F168: cumulative editorial input too large');
  const unique=e.serviceSlug+'|'+e.locale+'|'+e.ibgeCode;
  if(seenKeys.has(unique)){duplicateKeys++;if(hits.length<200)
    hits.push({index:i,priorIndex:seenKeys.get(unique),code:'duplicate_municipality_service_locale'});}
  else seenKeys.set(unique,i);
  distinctServices.add(e.serviceSlug);
  const normalized=template(e.localContent,e.city,e.state);
  const digest=createHash('sha256').update(e.serviceSlug+'\0'+e.locale+'\0'+normalized).digest('hex');
  const old=seenContent.get(digest);
  if(old && old.ibgeCode!==e.ibgeCode){
   templatedAcrossCities++;
   if(hits.length<200)hits.push({index:i,priorIndex:old.index,code:'city_substitution_template_duplicate'});
  }else if(!old)seenContent.set(digest,{ibgeCode:e.ibgeCode,index:i});
 }
 return Object.freeze({
  contractVersion:'seo-f168-national-city-template-review-v1',
  examinedEntries:input.entries.length,
  distinctServices:distinctServices.size,
  duplicateMunicipalityServiceLocaleCount:duplicateKeys,
  identicalCitySubstitutionTemplateCount:templatedAcrossCities,
  emittedDiagnostics:hits.length,
  truncatedDiagnostics:duplicateKeys+templatedAcrossCities>hits.length,
  diagnostics:Object.freeze(hits.map(x=>Object.freeze(x))),
  editorialSourceAuthenticated:false,
  nationalInventoryCompletenessVerified:false,
  officialIbgeMunicipalitiesVerified:false,
  nearDuplicateSimilarityVerified:false,
  originalLocalContentVerified:false,
  publicationAuthorized:false,
  indexingAuthorized:false,
  networkPerformed:false,
  releaseStatus:duplicateKeys||templatedAcrossCities?'HOLD_TEMPLATED_OR_DUPLICATE_CITY_CONTENT':'HOLD_EDITORIAL_IBGE_AND_INDEPENDENT_REVIEW'
 });
}
