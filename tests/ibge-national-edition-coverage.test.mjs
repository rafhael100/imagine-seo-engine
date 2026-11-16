import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewIbgeMmd2025NationalCoverage as review} from
 '../src/ibge-national-edition-coverage.mjs';

const UF={
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
};
function reference(){
 const items=[];
 const states=Object.entries(UF).filter(([state])=>state!=='DF');
 for(let i=0;i<5569;i++){
  const [state,prefix]=states[i%states.length];
  const sub=String(Math.floor(i/states.length)+1).padStart(5,'0');
  items.push({
   ibgeCode:prefix+sub,state,
   city:'Municipio Sintetico '+String(i+1)
  });
 }
 items.push({ibgeCode:'5300108',state:'DF',city:'Brasília'});
 items.push({ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'});
 items.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 return {
  sourceType:'operator_supplied_municipality_reference_unverified',
  entries:items
 };
}
const pass=x=>review({reference:x,editionId:'IBGE_MMD_2025'});
test('F153 separates 5569 legal candidates from 5571 directory entries incl two special districts',()=>{
 const out=pass(reference());
 assert.equal(out.reviewStatus,
  'human_edition_territorial_and_editorial_review_required');
 assert.equal(out.summary.localityDirectoryRows,5571);
 assert.equal(out.summary.municipalityCandidateRows,5569);
 assert.equal(out.summary.knownSpecialDistrictRows,2);
 assert.equal(out.summary.federationUnitsPresent,27);
 assert.equal(out.sourceOfficiallyAuthenticated,false);
 assert.equal(out.currentLegalTerritorialEditionVerified,false);
 assert.equal(out.referenceCoversAllOfficialMunicipalitiesVerified,false);
 assert.equal(out.indexingAuthorized,false);
 assert.equal(out.publicationAuthorized,false);
 assert.equal(out.networkPerformed,false);
 assert.doesNotMatch(JSON.stringify(out),/Munic[ií]pio Sint[eé]tico|Bras[ií]lia|Fernando de Noronha/);
});
test('F153 blocks missing or swapped Brasília/Fernando de Noronha classification',()=>{
 const old=reference();
 old.entries=old.entries.filter(x=>x.ibgeCode!=='2605459');
 const a=pass(old);
 assert.equal(a.reviewStatus,'blocked');
 assert.ok(a.blockedComponents.includes('expectedLocalityRows'));
 assert.ok(a.blockedComponents.includes('exactlyTwoSpecialDistricts'));
 const corrupt=reference();
 corrupt.entries.find(x=>x.ibgeCode==='5300108').city='Cidade Fantasia';
 const b=pass(corrupt);
 assert.deepEqual(b.blockedComponents,['codesAndNamesStructurallyValid']);
});
test('F153 blocks 5571 rows with fake duplicated or unordered code',()=>{
 const r=reference();
 r.entries[1].ibgeCode=r.entries[0].ibgeCode;
 const out=pass(r);
 assert.equal(out.reviewStatus,'blocked');
 assert.ok(out.blockedComponents.includes('uniqueOrderedCodes'));
 assert.equal(out.summary.duplicateCodes,1);
});
test('F153 catches incomplete UF coverage despite matching global count',()=>{
 const r=reference();
 const code=r.entries.find(x=>x.state==='AC').ibgeCode;
 const affected=r.entries.filter(x=>x.state==='AC');
 // Simulate a whole state mistakenly mapped to a single other state's
 // well-formed, nonconflicting 7-digit codes.
 for(let i=0;i<affected.length;i++){
  affected[i].state='CE';
  affected[i].ibgeCode='23'+String(i+70000).padStart(5,'0');
 }
 r.entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 const result=pass(r);
 assert.equal(result.reviewStatus,'blocked');
 assert.ok(result.blockedComponents.includes('allFederationUnitsPresent'));
 assert.equal(code.length,7);
});
test('F153 refuses wrong edition, unauthorized release flag and accessors',()=>{
 const r=reference();
 assert.throws(()=>review({
  reference:r,editionId:'IBGE_MMD_2026'
 }),/SEO F153/);
 assert.throws(()=>review({
  reference:r,editionId:'IBGE_MMD_2025',approveDeploy:true
 }),/SEO F153/);
 const row=r.entries[0];
 Object.defineProperty(row,'city',{
  enumerable:true,get(){throw Error('secret getter')}
 });
 assert.throws(()=>pass(r),/SEO F153/);
});
