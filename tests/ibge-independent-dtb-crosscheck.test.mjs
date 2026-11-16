import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parseNormalizedDtb2025Csv,
 reviewIndependentDtbMunicipalCrosscheck as review
} from '../src/ibge-independent-dtb-crosscheck.mjs';

const PREFIX={
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
};
const special=new Set(['5300108','2605459']);
function reference(){
 const states=Object.entries(PREFIX).filter(([s])=>s!=='DF');
 const entries=Array.from({length:5569},(_,i)=>{
  const [state,prefix]=states[i%states.length];
  return {
   ibgeCode:prefix+String(Math.floor(i/states.length)+1).padStart(5,'0'),
   state,city:'Cidade Exemplo '+String(i+1)
  };
 });
 entries.push({ibgeCode:'5300108',state:'DF',city:'Brasília'});
 entries.push({ibgeCode:'2605459',state:'PE',city:'Fernando de Noronha'});
 entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
 return {
  sourceType:'operator_supplied_municipality_reference_unverified',
  entries
 };
}
function csv(ref,includeSpecial=false){
 const rows=ref.entries.filter(e=>includeSpecial||!special.has(e.ibgeCode));
 return 'ibgeCode;state;city\n'+rows.map(e=>
   [e.ibgeCode,e.state,e.city].join(';')
 ).join('\n')+'\n';
}
const run=(referenceValue,normalizedDtbCsv)=>review({
 localityReference:referenceValue,
 normalizedDtbCsv,
 editionId:'IBGE_DTB_2025'
});
test('F156 independent 5569 DTB rows agree with 5571 locality rows but still HOLD',()=>{
 const ref=reference(),out=run(ref,csv(ref));
 assert.equal(out.reviewStatus,
  'human_official_dtb_provenance_and_edition_review_required');
 assert.deepEqual(out.blockedComponents,[]);
 assert.equal(out.summary.dtbRows,5569);
 assert.equal(out.summary.dtbKnownSpecialRows,0);
 assert.equal(out.summary.municipalityCandidatesReconciled,5569);
 assert.equal(out.summary.localityRows,5571);
 assert.equal(out.officialDtbWorkbookAuthenticated,false);
 assert.equal(out.independentOfficialProvenanceProved,false);
 assert.equal(out.publicationAuthorized,false);
 assert.equal(out.indexingAuthorized,false);
 assert.equal(out.networkPerformed,false);
 assert.equal(out.redactedSampleIndices.length,0);
});
test('F156 also accepts fully reconciled 5571-row DTB-export style',()=>{
 const ref=reference(),out=run(ref,csv(ref,true));
 assert.equal(out.reviewStatus,
  'human_official_dtb_provenance_and_edition_review_required');
 assert.equal(out.summary.dtbKnownSpecialRows,2);
 assert.equal(out.summary.municipalityCandidatesReconciled,5569);
});
test('F156 blocks one municipality renaming despite matching codes and counts',()=>{
 const ref=reference();
 const edited=csv(ref).replace('Cidade Exemplo 1\n',
   'Cidade Diferente 1\n');
 const out=run(ref,edited);
 assert.equal(out.reviewStatus,'blocked');
 assert.ok(out.blockedComponents.includes('municipality_names_disagree'));
 assert.equal(out.summary.municipalityNameMismatches,1);
 const serialized=JSON.stringify(out);
 for(const secret of ['Cidade Diferente','Cidade Exemplo','Brasília','1100001'])
   assert.ok(!serialized.includes(secret),secret);
 assert.equal(out.publicationAuthorized,false);
});
test('F156 blocks a new wrong code with one old code lost despite proper count',()=>{
 const ref=reference();
 const lines=csv(ref).trimEnd().split('\n');
 const idx=lines.findIndex(line=>line.startsWith('2300001;'));
 assert.ok(idx>0);
 lines[idx]='2300000;CE;Cidade Nova Sintetica';
 const broken=lines.slice(1).sort((a,b)=>a.localeCompare(b));
 const out=run(ref,[lines[0],...broken].join('\n')+'\n');
 assert.equal(out.reviewStatus,'blocked');
 assert.equal(out.summary.missingInLocalityReference,1);
 assert.equal(out.summary.unexpectedLocalityRows,1);
 assert.equal(out.automatedRedirectsCreated,false);
});
test('F156 refuses missing header, forbidden formula, duplicate, bad UF and extra source authority',()=>{
 const ref=reference(),original=csv(ref);
 assert.throws(()=>parseNormalizedDtb2025Csv(
   original.replace('ibgeCode;state;city','Codigo;Estado;Municipio')
 ),/SEO F156/);
 assert.throws(()=>parseNormalizedDtb2025Csv(
   original.replace('Cidade Exemplo 1\n','=HYPERLINK(1)\n')
 ),/SEO F156/);
 const rows=original.split('\n');
 rows[2]=rows[1];
 assert.throws(()=>parseNormalizedDtb2025Csv(rows.join('\n')),/SEO F156/);
 assert.throws(()=>parseNormalizedDtb2025Csv(
   original.replace(';AC;',';DF;')
 ),/SEO F156/);
 assert.throws(()=>review({
  normalizedDtbCsv:original,localityReference:ref,
  editionId:'IBGE_DTB_2025',approveDeploy:true
 }),/SEO F156/);
 assert.throws(()=>run(ref,'bad,unsourced,data'),/SEO F156/);
});
test('F156 parses a quoted semicolon and doubled quote without treating value as code',()=>{
 const ref=reference(),raw=csv(ref);
 const changed=raw.replace('Cidade Exemplo 1\n',
   '"Cidade; Exemplo ""1""";\n');
 assert.throws(()=>parseNormalizedDtb2025Csv(changed),/SEO F156/);
});
