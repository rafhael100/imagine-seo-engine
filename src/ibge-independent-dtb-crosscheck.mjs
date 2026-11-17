/**
 * SEO F156 — compare an operator-normalized export of the official IBGE
 * Divisão Territorial Brasileira (DTB) 2025 municipality report against an
 * independently supplied F110/F111 locality reference.
 *
 * This is a SECOND STRUCTURAL SOURCE, NOT official authentication. The
 * operator must obtain the original DTB XLS/ODS from IBGE, verify its
 * provenance/edition and export exactly ibgeCode;state;city as UTF-8.
 * No DNS, HTTP, Google, writing, release or business action occurs here.
 */
import {reviewIbgeMmd2025NationalCoverage} from
  './ibge-national-edition-coverage.mjs';

const PREFIX=Object.freeze({
 RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
 MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
 MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
 MS:'50',MT:'51',GO:'52',DF:'53'
});
const SPECIAL=new Set(['5300108','2605459']);
const exact=(obj,keys)=>obj!==null&&typeof obj==='object'&&
 !Array.isArray(obj)&&[Object.prototype,null].includes(
 Object.getPrototypeOf(obj))&&Reflect.ownKeys(obj).length===keys.length&&
 keys.every(k=>{
  const d=Object.getOwnPropertyDescriptor(obj,k);
  return d?.enumerable===true&&Object.hasOwn(d,'value');
 });
const fail=()=>{throw Error('SEO F156: unsafe or malformed independent DTB input');};
const cleanName=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLocaleLowerCase('pt-BR').replace(/[’‘]/g,"'")
 .replace(/\s+/g,' ').trim();

function csvRow(line){
 const values=[];
 let out='',quoted=false,wasQuoted=false,finishedQuote=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='"'){
   if(quoted&&line[i+1]==='"'){out+='"';i++;continue;}
   if(quoted){quoted=false;finishedQuote=true;continue;}
   if(out===''&&!wasQuoted&&!finishedQuote){quoted=true;wasQuoted=true;continue;}
   fail();
  }
  if(c===';'&&!quoted){
   values.push(out);out='';wasQuoted=false;finishedQuote=false;continue;
  }
  if(finishedQuote&&!quoted)fail();
  if(c==='\r'||c==='\n'||c==='\u0000'||c==='\u007f'||out.length>160)fail();
  out+=c;
 }
 if(quoted)fail();
 values.push(out);
 if(values.length!==3||values.some(s=>s.length>160))fail();
 return values;
}

export function parseNormalizedDtb2025Csv(text){
 if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>1024*1024||
   text.length<100||text.includes('\u0000'))fail();
 const clean=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 if(clean.includes('\r'))fail();
 const lines=clean.split('\n');
 if(lines[lines.length-1]==='')lines.pop();
 if(lines.length<5500||lines.length>5575)fail();
 if(lines[0]!=='ibgeCode;state;city')fail();
 const map=new Map();
 let last='',specials=0;
 for(let i=1;i<lines.length;i++){
  const [code,state,city]=csvRow(lines[i]);
  if(!/^\d{7}$/.test(code)||!Object.hasOwn(PREFIX,state)||
      code.slice(0,2)!==PREFIX[state]||
      city.length<2||city.length>120||city.trim()!==city||
      /[\u0000-\u001f\u007f<>]/.test(city)||
      /^[=+@-]/.test(city)||cleanName(city).length<2||
      code<=last||map.has(code))fail();
  map.set(code,{state,city,index:i-1});
  last=code;
  if(SPECIAL.has(code))specials++;
 }
 if((map.size!==5569&&map.size!==5571)||
    (map.size===5569&&specials!==0)||
    (map.size===5571&&specials!==2))fail();
 return {rows:map,specials};
}
export function reviewIndependentDtbMunicipalCrosscheck(input){
 if(!exact(input,['normalizedDtbCsv','localityReference','editionId'])||
   input.editionId!=='IBGE_DTB_2025')fail();
 const dtb=parseNormalizedDtb2025Csv(input.normalizedDtbCsv);
 // F153 checks the source side before reconciliation; it may return
 // blocked rather than certify an invented or incomplete locality list.
 const national=reviewIbgeMmd2025NationalCoverage({
  reference:input.localityReference,editionId:'IBGE_MMD_2025'
 });
 const entries=input.localityReference.entries;
 const source=new Map(entries.map((entry,i)=>[
  entry.ibgeCode,{state:entry.state,city:entry.city,index:i}
 ]));
 let missing=0,nameMismatch=0,ufMismatch=0,
   extra=0,specialMismatch=0;
 const examples=[];
 function record(kind,index){
  if(examples.length<50)examples.push({kind,ordinalIndex:index});
 }
 for(const [code,row] of dtb.rows){
  const other=source.get(code);
  if(!other){
   missing++;record('dtb_code_missing_from_localities',row.index);continue;
  }
  if(other.state!==row.state){
   ufMismatch++;record('uf_disagreement',row.index);
  }
  if(cleanName(other.city)!==cleanName(row.city)){
   nameMismatch++;record('city_name_disagreement',row.index);
  }
 }
 for(const [code,entry] of source){
  if(!dtb.rows.has(code)){
   if(SPECIAL.has(code)&&dtb.rows.size===5569)continue;
   extra++;record('locality_code_missing_from_dtb',entry.index);
  }
 }
 if(dtb.rows.size===5571){
  for(const code of SPECIAL){
   if(!source.has(code)||!dtb.rows.has(code))specialMismatch++;
  }
 }
 const issues=[...national.blockedComponents];
 if(missing)issues.push('dtb_codes_missing_from_reference');
 if(extra)issues.push('locality_codes_missing_from_dtb');
 if(nameMismatch)issues.push('municipality_names_disagree');
 if(ufMismatch)issues.push('municipality_uf_disagree');
 if(specialMismatch)issues.push('territorial_special_codes_disagree');
 const unique=[...new Set(issues)];
 return {
  contractVersion:'seo-f156-independent-dtb2025-municipal-crosscheck-v1',
  reviewStatus:unique.length?'blocked':
    'human_official_dtb_provenance_and_edition_review_required',
  blockedComponents:unique,
  summary:{
   dtbRows:dtb.rows.size,
   dtbKnownSpecialRows:dtb.specials,
   localityRows:entries.length,
   municipalityCandidatesReconciled:dtb.rows.size-dtb.specials,
   missingInLocalityReference:missing,
   unexpectedLocalityRows:extra,
   municipalityNameMismatches:nameMismatch,
   municipalityUfMismatches:ufMismatch,
   specialTerritorialMismatches:specialMismatch,
   nationalReferenceStructureBlocked:national.blockedComponents.length>0,
   redactedSampleCount:examples.length
  },
  redactedSampleIndices:examples,
  officialDtbWorkbookAuthenticated:false,
  independentOfficialProvenanceProved:false,
  matchingReferenceMayShareSameUntrustedOrigin:true,
  currentEditionLegallyVerified:false,
  websiteMunicipalityCoverageVerified:false,
  realLocalServiceCoverageVerified:false,
  automatedRedirectsCreated:false,
  publicationAuthorized:false,
  indexingAuthorized:false,
  networkPerformed:false,
  releaseStatus:'HOLD_DTB_ORIGINAL_PROVENANCE_EDITION_EDITORIAL_AND_HUMAN_RELEASE'
 };
}
