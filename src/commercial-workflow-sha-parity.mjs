/** F164: compare two independently defined immutable Comercial QA targets. */
const pin=/^[a-f0-9]{40}$/;
export function reviewCommercialWorkflowParity(a,b){
 const inspect=source=>{
  if(typeof source!=='string'||!source.trim()||source.length>100000)
   throw Error('F164: reviewed workflow required');
  const repositories=[...source.matchAll(/^\s*repository:\s*(\S+)\s*$/gm)].map(x=>x[1]);
  const refs=[...source.matchAll(/^\s*ref:\s*([^\s#]+)\s*$/gm)].map(x=>x[1]);
  const assertions=[...source.matchAll(/rev-parse HEAD\)"\s*=\s*([a-f0-9]{40})/g)].map(x=>x[1]);
  if(repositories.length!==1||repositories[0]!=='rafhael100/imagine-comercial'||
    refs.length!==1||!pin.test(refs[0])||
    assertions.length!==1||assertions[0]!==refs[0])
   throw Error('F164: missing or ambiguous pinned Comercial checkout identity');
  return refs[0];
 };
 const left=inspect(a),right=inspect(b);
 if(left!==right)throw Error('F164: Astro and Chromium use different Comercial commits');
 return Object.freeze({
  contractVersion:'seo-f164-pinned-commercial-parity-v1',
  sharedPinnedCommercialSha:left,
  checkedWorkflows:2,
  independentReviewRequired:true,
  publicationAuthorized:false,
  mergeAuthorized:false,
  deployAuthorized:false,
  releaseStatus:'HOLD_INDEPENDENT_REVIEW_AND_OPERATIONAL_GATES'
 });
}
