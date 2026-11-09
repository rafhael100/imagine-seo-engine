/**
 * SEO-F2 — filtro pré-editorial para páginas de serviço por município.
 * NUNCA gera/publica URLs, jamais afirma validar demanda real ou dados IBGE.
 * O código do município deve ser validado depois contra base oficial autorizada.
 */
const UF=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const SOURCES=new Set(['search_console','keyword_research','sales_enquiries','editorial_research']);
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_OR_PHONE=/(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(?:\+?\d[\s()-]*){8,}/i;
function text(value,max=25000){return typeof value==='string'&&value.length<=max?value.trim():'';}
function normalized(s){
  return text(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
}
function normalizedContent(item){
  let content=normalized(item.localContent||'');
  for (const term of [item.city,item.state,item.serviceSlug].filter(Boolean)) {
    const phrase=normalized(term);
    if(phrase.length>=2) content=content.split(phrase).join(' GEO ');
  }
  return content;
}
function shingles(item){
  const words=normalizedContent(item).split(/\s+/).filter(Boolean);
  const result=new Set();
  for(let i=0;i<words.length-2;i++)result.add(words.slice(i,i+3).join(' '));
  return result;
}
export function similarityForGeoPages(a,b){
  const s1=shingles(a),s2=shingles(b);
  if(!s1.size||!s2.size)return 0;
  let common=0;
  for(const shingle of s1)if(s2.has(shingle))common++;
  return Math.round((common/(s1.size+s2.size-common))*1000)/1000;
}
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&
  !Number.isNaN(Date.parse(d+'T00:00:00Z'));

export function evaluateGeoCandidate(candidate,existing=[],{maxSimilarity=0.75}={}){
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))throw new Error('geo: candidate object expected');
  if(!Array.isArray(existing)||existing.length>5000)throw new Error('geo: existing examples must be a bounded array');
  if(typeof maxSimilarity!=='number'||maxSimilarity<0||maxSimilarity>1)throw new Error('geo: invalid similarity threshold');
  const reasons=[];
  if(!SLUG.test(candidate.serviceSlug||''))reasons.push('service_slug_invalid');
  if(!/^\d{7}$/.test(candidate.ibgeCode||''))reasons.push('municipality_code_format_invalid');
  if(!UF.has(candidate.state))reasons.push('state_code_invalid');
  if(text(candidate.city,120).length<2)reasons.push('municipality_name_missing');
  if(candidate.availabilityConfirmed!==true)reasons.push('local_service_availability_unconfirmed');
  if(text(candidate.reasonForLocalPage,3000).length<100)reasons.push('local_page_rationale_insufficient');
  if(text(candidate.localContent).length<350)reasons.push('local_content_insufficient');
  if(EMAIL_OR_PHONE.test(candidate.localContent||''))reasons.push('possible_personal_data_in_content');
  if(!Array.isArray(candidate.demandEvidence)||candidate.demandEvidence.length===0){
    reasons.push('search_demand_evidence_missing');
  }else{
    for(const evidence of candidate.demandEvidence.slice(0,20)){
      if(!evidence||!SOURCES.has(evidence.source)||
        !validDate(evidence.observedAt)||text(evidence.explanation,3000).length<40){
        reasons.push('search_demand_evidence_invalid');break;
      }
    }
    if(candidate.demandEvidence.length>20)reasons.push('too_many_evidence_entries');
  }
  let maxFound=0;
  for(const previous of existing){
    if(previous && previous.serviceSlug===candidate.serviceSlug && previous.ibgeCode===candidate.ibgeCode) {
      reasons.push('municipality_service_page_already_exists');
      continue;
    }
    const v=similarityForGeoPages(candidate,previous||{});
    if(v>maxFound)maxFound=v;
  }
  if(maxFound>=maxSimilarity)reasons.push('possible_templated_or_duplicate_location_content');
  const ready=reasons.length===0;
  // Mesmo quando passou pelas regras, exige decisão humana e operação homologada.
  return Object.freeze({
    status: ready?'human_editorial_review_required':'blocked',
    publishAllowed:false,
    indexingAllowed:false,
    reasons:Object.freeze([...new Set(reasons)]),
    largestContentSimilarity:maxFound,
    methodology:'local_requirements_and_3gram_jaccard_no_search_metrics'
  });
}
