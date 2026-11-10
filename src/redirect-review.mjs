/**
 * SEO-F22 — offline review of potential redirect coverage for disappearing URLs.
 * Does not produce 301 rules, authorize a release, or inspect live hosts.
 * Even a complete mapping stays on HOLD until an independently authorized
 * manual URL-by-URL review and deployment.
 */
function validateRoute(raw){
  if(typeof raw!=='string'||raw.length<1||raw.length>512||
     !raw.startsWith('/')||raw.startsWith('//')||
     /[?#%\\\u0000-\u001f\u007f]/.test(raw)||
     raw.split('/').some(x=>x==='.'||x==='..'||x===''))
    throw Error('SEO redirect review: invalid route');
  if(!/^\/[A-Za-z0-9._~!$&'()*+,;=:@/-]*$/.test(raw))
    throw Error('SEO redirect review: invalid route');
  if(new URL(raw,'https://local.invalid/').pathname!==raw)
    throw Error('SEO redirect review: invalid route');
  return raw;
}
function routeSet(raw){
  if(!Array.isArray(raw)||raw.length>20000)
    throw Error('SEO redirect review: route inventory required');
  const routes=raw.map(validateRoute);
  if(new Set(routes).size!==routes.length)
    throw Error('SEO redirect review: duplicate routes');
  return new Set(routes);
}
export function reviewStaticRouteMigration({before,after,candidates=[]}={}){
  const old=routeSet(before?.routes),next=routeSet(after?.routes);
  if(!Array.isArray(candidates)||candidates.length>20000)
    throw Error('SEO redirect review: bounded redirect candidates required');
  const removed=[...old].filter(p=>!next.has(p));
  const added=[...next].filter(p=>!old.has(p));
  const gone=new Set(removed),seen=new Set();
  for(const candidate of candidates){
    if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||
      Object.keys(candidate).length!==2||!Object.hasOwn(candidate,'from')||
      !Object.hasOwn(candidate,'to'))
      throw Error('SEO redirect review: exact from/to candidates required');
    const from=validateRoute(candidate.from),to=validateRoute(candidate.to);
    if(!gone.has(from)||from===to||to==='/404.html'||
      !next.has(to)||seen.has(from))
      throw Error('SEO redirect review: invalid, duplicate or unsupported candidate');
    seen.add(from);
  }
  const unmappedCount=removed.length-seen.size;
  return {
    contractVersion:'seo-redirect-review-offline-v1',
    sourceType:'operator_supplied_static_builds_and_redirects_unverified',
    beforeCount:old.size,
    afterCount:next.size,
    removedCount:removed.length,
    addedCount:added.length,
    candidateCount:seen.size,
    unmappedCount,
    structurallyComplete:unmappedCount===0,
    humanReviewRequired:removed.length>0,
    deploymentAuthorized:false,
    appliedRedirects:0,
    caveats:[
      'Candidate mappings are only syntactically checked against local route inventories.',
      'Every deleted URL needs evidence of content equivalence, actual legacy HTTP status and backlinks, legal/editorial review and verified production redirect behavior.',
      'No production redirects, deploy approvals, DNS changes or Google Search Console requests were made.'
    ]
  };
}
