/**
 * SEO F108: read-only consistency check of an operator-supplied municipal
 * page inventory. Does not assert that the inventory is complete, approved,
 * public, official IBGE data or evidence of actual Google indexation.
 *
 * Input contains no page body or private leads. Output contains only row
 * indices and approved conflict codes, never paths or digests.
 */
const MAX_ENTRIES=50000;
const MAX_CONFLICTS=200;
const FIELDS=['sourceType','entries'];
const ENTRY_FIELDS=[
  'serviceSlug','ibgeCode','state','locale','canonicalPath','contentSha256'
];
const UF=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const LOCALES=new Set(['pt-BR','en-US','es-ES']);
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA=/^[a-f0-9]{64}$/;
const MUNICIPALITY=/^[0-9]{7}$/;
const PATH=/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/;
function exactObject(value,fields){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(value,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function denseArray(value){
  if(!Array.isArray(value) ||
     Object.getPrototypeOf(value)!==Array.prototype ||
     value.length<1||value.length>MAX_ENTRIES)return false;
  const keys=Reflect.ownKeys(value);
  if(keys.length!==value.length+1)return false;
  for(let i=0;i<value.length;i++){
    const d=Object.getOwnPropertyDescriptor(value,String(i));
    if(d?.enumerable!==true||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
function validEntry(x){
  return exactObject(x,ENTRY_FIELDS) &&
    typeof x.serviceSlug==='string'&&x.serviceSlug.length<=72&&
      SLUG.test(x.serviceSlug) &&
    typeof x.ibgeCode==='string'&&MUNICIPALITY.test(x.ibgeCode) &&
    typeof x.state==='string'&&UF.has(x.state) &&
    typeof x.locale==='string'&&LOCALES.has(x.locale) &&
    typeof x.canonicalPath==='string'&&x.canonicalPath.length<=240&&
      PATH.test(x.canonicalPath) &&
    typeof x.contentSha256==='string'&&SHA.test(x.contentSha256);
}
export function reviewMunicipalPageInventory(input){
  if(!exactObject(input,FIELDS) ||
    input.sourceType!=='operator_local_inventory_unverified' ||
    !denseArray(input.entries))
    throw Error('SEO F108: invalid bounded offline inventory');

  const keySeen=new Map(),pathSeen=new Map(),hashSeen=new Map();
  const totals={
    municipalityServiceLocaleCollisions:0,
    canonicalPathCollisions:0,
    identicalBodyDigestCollisions:0
  };
  const conflicts=[];
  const add=(index,earlier,code)=>{
    totals[code]++;
    if(conflicts.length<MAX_CONFLICTS)
      conflicts.push({itemIndex:index,earlierItemIndex:earlier,code});
  };

  for(let i=0;i<input.entries.length;i++){
    const e=input.entries[i];
    if(!validEntry(e))
      throw Error('SEO F108: invalid bounded offline inventory');
    const key=e.locale+'|'+e.serviceSlug+'|'+e.ibgeCode;
    const firstKey=keySeen.get(key);
    if(firstKey!==undefined)add(i,firstKey,'municipalityServiceLocaleCollisions');
    else keySeen.set(key,i);

    const firstPath=pathSeen.get(e.canonicalPath);
    if(firstPath!==undefined)add(i,firstPath,'canonicalPathCollisions');
    else pathSeen.set(e.canonicalPath,i);

    // The manifest digest is only a declaration from the operator.
    // Hash identity can catch identical submitted bodies but cannot
    // prove near-duplicate/doorway content or tamper-free publication.
    const firstHash=hashSeen.get(e.contentSha256);
    if(firstHash!==undefined)add(i,firstHash,'identicalBodyDigestCollisions');
    else hashSeen.set(e.contentSha256,i);
  }

  const collisionCount=Object.values(totals).reduce((a,b)=>a+b,0);
  return {
    contractVersion:'seo-municipal-inventory-consistency-offline-v1',
    sourceType:'operator_local_inventory_unverified',
    status:collisionCount?'corrections_required':'human_editorial_review_required',
    summary:{
      inspectedEntries:input.entries.length,
      distinctMunicipalityServiceLocaleKeys:keySeen.size,
      distinctCanonicalPaths:pathSeen.size,
      distinctDeclaredBodyHashes:hashSeen.size,
      ...totals,
      conflictCount:collisionCount,
      emittedConflictCount:conflicts.length,
      truncatedConflicts:collisionCount>conflicts.length
    },
    conflicts,
    officialIbgeVerified:false,
    municipalityStateMappingVerified:false,
    contentDigestMatchedToRealPage:false,
    inventoryCompletenessVerified:false,
    actualPublicationVerified:false,
    nearDuplicateContentChecked:false,
    publishAllowed:false,
    indexingAllowed:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_OFFICIAL_IBGE_GLOBAL_INVENTORY_AND_EDITORIAL_REVIEW',
    caveats:[
      'A complete-looking inventory does not prove that all public pages are included.',
      'A seven-digit municipality code and valid UF do not prove an official IBGE municipality/UF match.',
      'Identical declared SHA-256 values are only operator-submitted content hints, not authenticated published page hashes.',
      'Cross-page semantic similarity, local service availability and search demand are not established by this review.'
    ]
  };
}
