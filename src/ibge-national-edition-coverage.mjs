/**
 * SEO F153 — structural nationwide completeness review of a LOCAL F110
 * IBGE-style reference against the documented IBGE MMD 2025 taxonomy.
 *
 * The 2025 MMD reports 5,569 legal municipalities + Brasilia (DF) +
 * Fernando de Noronha (state district), while the locality/statistical
 * directory includes 5,571 rows. Other operational polygons in the MMD
 * are NOT municipalities. This is edition-scoped and NEVER authenticates
 * the supplied JSON, territorial legal classification or SEO permission.
 *
 * Official published reference:
 * https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html
 */
const PREFIX={
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
};
const SPECIAL=new Map([
 ['5300108',{state:'DF',name:'brasilia'}],
 ['2605459',{state:'PE',name:'fernando de noronha'}]
]);
const EXPECTED_ROWS=5571,EXPECTED_MUNICIPALITIES=5569;
const plain=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 [Object.prototype,null].includes(Object.getPrototypeOf(v))&&
 Reflect.ownKeys(v).length===keys.length&&
 Reflect.ownKeys(v).every(k=>{
   const d=Object.getOwnPropertyDescriptor(v,k);
   return typeof k==='string'&&keys.includes(k)&&
     d?.enumerable===true&&Object.hasOwn(d,'value');
 });
function dense(a){
 if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||
    a.length<1||a.length>6000||
    Reflect.ownKeys(a).length!==a.length+1)return false;
 for(let i=0;i<a.length;i++){
   const d=Object.getOwnPropertyDescriptor(a,String(i));
   if(!d?.enumerable||!Object.hasOwn(d,'value'))return false;
 }
 return true;
}
function nameNormalized(v){
 return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
}
function failed(){throw Error('SEO F153: invalid bounded municipality reference');}
export function reviewIbgeMmd2025NationalCoverage(input){
 if(!plain(input,['reference','editionId'])||
    input.editionId!=='IBGE_MMD_2025'||
    !plain(input.reference,['sourceType','entries'])||
    input.reference.sourceType!==
      'operator_supplied_municipality_reference_unverified'||
    !dense(input.reference.entries))failed();
 const entries=input.reference.entries;
 let invalidRows=0,duplicateCodes=0,prefixMismatches=0,
     illegalCityFields=0,specialNameOrStateMismatches=0;
 let specialCount=0;
 const codes=new Set(),states=new Set(),specialSeen=new Set();
 let previous='';
 for(const entry of entries){
   if(!plain(entry,['ibgeCode','state','city']))failed();
   if(typeof entry.ibgeCode!=='string'||
      !/^\d{7}$/.test(entry.ibgeCode)||
      typeof entry.state!=='string'||!Object.hasOwn(PREFIX,entry.state)||
      typeof entry.city!=='string'||
      entry.city.length<2||entry.city.length>120||
      entry.city.trim()!==entry.city||
      /[\u0000-\u001f\u007f<>]/.test(entry.city))
     failed();
   if(entry.ibgeCode<=previous)invalidRows++;
   previous=entry.ibgeCode;
   if(codes.has(entry.ibgeCode))duplicateCodes++;
   codes.add(entry.ibgeCode);
   states.add(entry.state);
   if(!entry.ibgeCode.startsWith(PREFIX[entry.state]))prefixMismatches++;
   if(nameNormalized(entry.city).length<2)illegalCityFields++;
   const special=SPECIAL.get(entry.ibgeCode);
   if(special){
     specialCount++;
     specialSeen.add(entry.ibgeCode);
     if(entry.state!==special.state||
        nameNormalized(entry.city)!==special.name)
       specialNameOrStateMismatches++;
   }
 }
 const municipalities=entries.length-specialCount;
 const checks={
   expectedLocalityRows:entries.length===EXPECTED_ROWS,
   expectedLegalMunicipalityCandidates:
     municipalities===EXPECTED_MUNICIPALITIES,
   exactlyTwoSpecialDistricts:specialCount===2&&specialSeen.size===2,
   allFederationUnitsPresent:states.size===27,
   uniqueOrderedCodes:duplicateCodes===0&&invalidRows===0,
   codesAndNamesStructurallyValid:
     prefixMismatches===0&&illegalCityFields===0&&
     specialNameOrStateMismatches===0
 };
 const failedRules=Object.entries(checks)
   .filter(([,ok])=>!ok).map(([rule])=>rule);
 return {
   contractVersion:'seo-f153-ibge-mmd2025-national-reference-coverage-v1',
   reviewStatus:failedRules.length?'blocked':
     'human_edition_territorial_and_editorial_review_required',
   blockedComponents:failedRules,
   summary:{
     localityDirectoryRows:entries.length,
     municipalityCandidateRows:municipalities,
     knownSpecialDistrictRows:specialCount,
     federationUnitsPresent:states.size,
     duplicateCodes,
     unorderedCodes:invalidRows,
     ufPrefixMismatches:prefixMismatches,
     invalidCityFields:illegalCityFields,
     specialTerritorialLabelMismatches:specialNameOrStateMismatches
   },
   expectedEdition:'IBGE_MMD_2025',
   sourceOfficiallyAuthenticated:false,
   referenceCoversAllOfficialMunicipalitiesVerified:false,
   currentLegalTerritorialEditionVerified:false,
   municipalityTypeInferredOnlyForTwoKnownExceptions:true,
   realServicePresencePerCityVerified:false,
   editorialQualityReviewed:false,
   googleOwnershipVerified:false,
   indexingAuthorized:false,
   publicationAuthorized:false,
   networkPerformed:false,
   releaseStatus:'HOLD_IBGE_EDITION_PROVENANCE_TERRITORIAL_EDITORIAL_AND_PUBLICATION'
 };
}
