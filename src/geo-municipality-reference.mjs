/**
 * SEO F110 — local municipality reference reconciliation.
 *
 * The UF prefixes are fixed Brazilian municipality-geocode structure.
 * The municipality list is supplied by the operator and its IBGE origin
 * cannot be authenticated by an offline process. No search, publishing,
 * Google provider, official API, or customer permission is performed.
 */
import {screenMunicipalDraftsAgainstInventory}
  from './geo-draft-inventory-gate.mjs';

const UF_PREFIX=Object.freeze({
  RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
  MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
  MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
  MS:'50',MT:'51',GO:'52',DF:'53'
});
const REFERENCE_FIELDS=['sourceType','entries'];
const ENTRY_FIELDS=['ibgeCode','state','city'];
function exact(v,fields){
  if(v===null||typeof v!=='object'||Array.isArray(v)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function dense(v){
  if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||
     v.length<1||v.length>6000)return false;
  const keys=Reflect.ownKeys(v);
  if(keys.length!==v.length+1)return false;
  for(let i=0;i<v.length;i++){
    const d=Object.getOwnPropertyDescriptor(v,String(i));
    if(d?.enumerable!==true||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
function normalizeCity(city){
  return city.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim()
    .replace(/\s+/g,' ');
}
function validEntry(v){
  return exact(v,ENTRY_FIELDS)&&
    typeof v.ibgeCode==='string'&&/^[0-9]{7}$/.test(v.ibgeCode)&&
    typeof v.state==='string'&&Object.hasOwn(UF_PREFIX,v.state)&&
    typeof v.city==='string'&&v.city.length>=2&&v.city.length<=120&&
    normalizeCity(v.city).length>=2;
}
const matchesPrefix=(code,uf)=>
  Object.hasOwn(UF_PREFIX,uf)&&code.slice(0,2)===UF_PREFIX[uf];

/**
 * Uses only original F109 input and an operator-provided reference snapshot.
 * Even a complete match is NOT authenticated IBGE or a release decision.
 */
export function reconcileMunicipalDraftsWithReference(input){
  if(!exact(input,['screenInput','municipalityReference']))
    throw Error('SEO F110: original draft/inventory input and reference required');
  const screening=screenMunicipalDraftsAgainstInventory(input.screenInput);
  const reference=input.municipalityReference;
  if(!exact(reference,REFERENCE_FIELDS) ||
     reference.sourceType!=='operator_supplied_municipality_reference_unverified'||
     !dense(reference.entries))
    throw Error('SEO F110: invalid bounded municipality reference');
  const byCode=new Map();
  let duplicateReferenceCodes=0,referenceUfPrefixConflicts=0;
  for(const e of reference.entries){
    if(!validEntry(e))
      throw Error('SEO F110: invalid bounded municipality reference');
    if(!matchesPrefix(e.ibgeCode,e.state))referenceUfPrefixConflicts++;
    if(byCode.has(e.ibgeCode))duplicateReferenceCodes++;
    else byCode.set(e.ibgeCode,e);
  }
  // An incomplete supplied reference is not evidence that an unlisted
  // code is nonexistent in the real IBGE municipality directory.
  const inventory=input.screenInput.inventoryInput.entries;
  let inventoryNotInReference=0,inventoryUfMismatch=0;
  let inventoryPrefixMismatch=0;
  for(const e of inventory){
    if(!matchesPrefix(e.ibgeCode,e.state))inventoryPrefixMismatch++;
    const municipality=byCode.get(e.ibgeCode);
    if(!municipality)inventoryNotInReference++;
    else if(municipality.state!==e.state)inventoryUfMismatch++;
  }

  const globalReferenceProblem=
    duplicateReferenceCodes>0||referenceUfPrefixConflicts>0||
    inventoryNotInReference>0||inventoryUfMismatch>0||
    inventoryPrefixMismatch>0;
  const reviews=screening.reviews.map((item,i)=>{
    const candidate=input.screenInput.draftBatchInput.candidates[i];
    const reasons=[...item.reasons];
    const referenceMunicipality=byCode.get(candidate.ibgeCode);
    if(!matchesPrefix(candidate.ibgeCode,candidate.state))
      reasons.push('candidate_uf_code_prefix_mismatch');
    if(!referenceMunicipality)
      reasons.push('candidate_missing_from_supplied_reference');
    else{
      if(referenceMunicipality.state!==candidate.state)
        reasons.push('candidate_uf_differs_from_reference');
      if(normalizeCity(referenceMunicipality.city)!==
         normalizeCity(candidate.city))
        reasons.push('candidate_city_name_differs_from_reference');
    }
    if(globalReferenceProblem)
      reasons.push('reference_or_inventory_reconciliation_needs_review');
    const unique=[...new Set(reasons)];
    return {
      draftIndex:item.draftIndex,
      status:unique.length?'blocked':'human_editorial_review_required',
      reasons:unique,
      publishingAllowed:false,
      indexingAllowed:false
    };
  });

  const blocked=reviews.filter(x=>x.status==='blocked').length;
  return {
    contractVersion:'seo-ibge-municipality-reference-review-offline-v1',
    sourceType:'operator_supplied_municipality_reference_not_authenticated',
    summary:{
      reviewedDrafts:reviews.length,
      suppliedReferenceEntries:reference.entries.length,
      distinctReferenceCodes:byCode.size,
      duplicateReferenceCodes,
      referenceUfPrefixConflicts,
      inventoryRows:inventory.length,
      inventoryNotInReference,
      inventoryUfMismatch,
      inventoryPrefixMismatch,
      blockedDrafts:blocked,
      awaitingHumanEditorialReview:reviews.length-blocked
    },
    reviews,
    municipalityReferenceAuthenticatedAsIBGE:false,
    completenessOfMunicipalitiesVerified:false,
    editorialQualityIndependentlyApproved:false,
    officialLocalServiceCoverageVerified:false,
    publishAllowed:false,
    indexingAllowed:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_AUTHENTIC_IBGE_SOURCE_EDITORIAL_AND_RELEASE_APPROVAL',
    caveats:[
      'UF prefix structure is checked locally, but exact municipality IDs and names come from an unverified operator-supplied reference.',
      'A municipality missing from an incomplete reference is not proof that it does not exist.',
      'Even a matching code/name/UF does not establish editorial quality, actual service availability, Google indexation, or permission to publish.'
    ]
  };
}
