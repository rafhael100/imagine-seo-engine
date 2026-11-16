/**
 * SEO F155 — offline, privacy-preserving change detection between two
 * independently obtained F110 municipality reference snapshots.
 * Designed for a future MMD edition; never treats a new list as official
 * or triggers city publication/deletion automatically.
 */
const PREFIX=Object.freeze({
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
});
const SPECIAL=new Set(['5300108','2605459']);
function exact(v,fields){
 if(v===null||typeof v!=='object'||Array.isArray(v)||
   ![Object.prototype,null].includes(Object.getPrototypeOf(v))||
   Reflect.ownKeys(v).length!==fields.length)return false;
 return Reflect.ownKeys(v).every(k=>{
   const d=Object.getOwnPropertyDescriptor(v,k);
   return typeof k==='string'&&fields.includes(k)&&
     d?.enumerable===true&&Object.hasOwn(d,'value');
 });
}
function fail(){throw Error('SEO F155: unsafe or incomplete national reference');}
function makeMap(reference){
 if(!exact(reference,['sourceType','entries'])||
    reference.sourceType!=='operator_supplied_municipality_reference_unverified'||
    !Array.isArray(reference.entries)||
    Object.getPrototypeOf(reference.entries)!==Array.prototype||
    reference.entries.length<5500||reference.entries.length>6000||
    Reflect.ownKeys(reference.entries).length!==
      reference.entries.length+1)fail();
 const map=new Map();
 let last='';
 for(let i=0;i<reference.entries.length;i++){
   const d=Object.getOwnPropertyDescriptor(reference.entries,String(i));
   if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();
   const e=d.value;
   if(!exact(e,['ibgeCode','state','city'])||
      typeof e.ibgeCode!=='string'||!/^\d{7}$/.test(e.ibgeCode)||
      typeof e.state!=='string'||!Object.hasOwn(PREFIX,e.state)||
      !e.ibgeCode.startsWith(PREFIX[e.state])||
      typeof e.city!=='string'||e.city.length<2||e.city.length>120||
      e.city.trim()!==e.city||
      /[\u0000-\u001f\u007f<>]/.test(e.city)||
      e.ibgeCode<=last||map.has(e.ibgeCode))fail();
   map.set(e.ibgeCode,{state:e.state,city:e.city,index:i});
   last=e.ibgeCode;
 }
 return map;
}
export function reviewIbgeNationalReferenceDelta(input){
 if(!exact(input,['previousReference','newReference']))fail();
 const before=makeMap(input.previousReference);
 const after=makeMap(input.newReference);
 let added=0,removed=0,nameChanges=0,ufChanges=0,specialChanges=0;
 const samples=[];
 function sample(kind,index){
   if(samples.length<50)samples.push({kind,referenceIndex:index});
 }
 for(const [code,current] of after){
   const prior=before.get(code);
   if(!prior){
     added++;
     if(SPECIAL.has(code))specialChanges++;
     sample('addition_requires_territorial_review',current.index);
   }else{
     if(current.state!==prior.state){
       ufChanges++;
       sample('state_change_requires_manual_review',current.index);
     }
     if(current.city!==prior.city){
       nameChanges++;
       sample('name_change_requires_slug_editorial_review',current.index);
     }
     if(SPECIAL.has(code)&&(
       current.state!==prior.state||current.city!==prior.city))
       specialChanges++;
   }
 }
 for(const [code,old] of before){
   if(!after.has(code)){
     removed++;
     if(SPECIAL.has(code))specialChanges++;
     sample('removal_requires_non_destructive_review',old.index);
   }
 }
 const changed=added+removed+nameChanges+ufChanges>0;
 const flags=[];
 if(added)flags.push('added_localities_require_official_edition_validation');
 if(removed)flags.push('removed_localities_must_not_be_deleted_automatically');
 if(nameChanges)flags.push('renamed_localities_require_editorial_slug_review');
 if(ufChanges)flags.push('geocode_uf_conflicts_require_review');
 if(specialChanges)flags.push('special_district_classification_changed');
 return {
   contractVersion:'seo-f155-national-locality-reference-delta-v1',
   reviewStatus:changed?'blocked':
     'human_current_edition_and_source_review_required',
   blockedComponents:flags,
   summary:{
     priorLocalityRows:before.size,
     currentLocalityRows:after.size,
     newlyObservedGeocodes:added,
     noLongerListedGeocodes:removed,
     changedNames:nameChanges,
     changedUfAssignments:ufChanges,
     specialDistrictChanges:specialChanges,
     reviewedChangedRows:samples.length
   },
   redactedSampleIndices:samples,
   previousOfficialOriginVerified:false,
   currentOfficialOriginVerified:false,
   legalEditionTransitionConfirmed:false,
   historicalPagesDeletedAutomatically:false,
   redirectsCreatedAutomatically:false,
   indexingAuthorized:false,
   publicationAuthorized:false,
   networkPerformed:false,
   releaseStatus:'HOLD_OFFICIAL_REFERENCE_PROVENANCE_AND_HUMAN_EDITORIAL_DIFF_REVIEW'
 };
}
