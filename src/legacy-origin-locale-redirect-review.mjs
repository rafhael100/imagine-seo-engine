/**
 * SEO F127 — read-only preflight of operator-supplied legacy host + language
 * URLs during migration to an HTTPS non-www canonical origin.
 *
 * F22 already handles route disappearances in static builds; this module
 * handles host/scheme changes that F22 cannot see in path-only inventories.
 * No network, redirect rule generation, Google data, or deployment.
 */
const MAX_ROWS=20000,MAX_DIAGNOSTICS=200;
const ROUTE=/^\/[A-Za-z0-9._~!$&'()*+,;=:@/-]*$/;
const DOMAIN=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const PATH_LOCALES=Object.freeze({english:['/en/','/en-us/'],spanish:['/es/','/es-es/']});
function exact(value,fields){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const own=Reflect.ownKeys(value);
  return own.length===fields.length&&own.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(value,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function dense(list){
  if(!Array.isArray(list)||Object.getPrototypeOf(list)!==Array.prototype||
     list.length>MAX_ROWS||Reflect.ownKeys(list).length!==list.length+1)
    return false;
  for(let i=0;i<list.length;i++){
    const d=Object.getOwnPropertyDescriptor(list,String(i));
    if(!d?.enumerable||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
function route(path){
  if(typeof path!=='string'||!path.startsWith('/')||
     path.length<1||path.length>512||path.startsWith('//')||
     path.includes('//')||!ROUTE.test(path)||/[?#%\\\x00-\x1f\x7f]/.test(path)||
     path.split('/').some(x=>x==='.'||x==='..'))
    throw Error('SEO F127: unsafe legacy route');
  if(new URL(path,'https://local.invalid').pathname!==path)
    throw Error('SEO F127: unsafe legacy route');
  return path;
}
function oldUrl(value,domain){
  if(typeof value!=='string'||value.length>900||
     !/^https?:\/\//.test(value)||/[?#%\\\x00-\x1f\x7f]/.test(value))
    throw Error('SEO F127: unapproved legacy URL');
  let url;
  try{url=new URL(value);}catch{throw Error('SEO F127: unapproved legacy URL');}
  if(!['http:','https:'].includes(url.protocol)||
     ![domain,'www.'+domain].includes(url.hostname)||
     url.host!==url.hostname||url.username||url.password||
     url.search||url.hash||url.href!==value)
    throw Error('SEO F127: unapproved legacy URL');
  route(url.pathname);
  return {url:value,path:url.pathname,scheme:url.protocol,host:url.hostname};
}
function locale(path){
  for(const [language,prefixes] of Object.entries(PATH_LOCALES))
    if(prefixes.some(p=>path===p.slice(0,-1)||path.startsWith(p)))return language;
  return 'portuguese';
}
export function reviewLegacyOriginAndLocaleRedirects(input){
  if(!exact(input,[
    'sourceType','siteDomain','canonicalOrigin','legacyUrls','targetRoutes','candidates'
  ])||input.sourceType!=='operator_supplied_legacy_urls_unverified'||
     typeof input.siteDomain!=='string'||input.siteDomain.length>220||
     !DOMAIN.test(input.siteDomain)||input.siteDomain.startsWith('www.')||
     input.canonicalOrigin!=='https://'+input.siteDomain+'/'||
     !dense(input.legacyUrls)||!dense(input.targetRoutes)||
     !dense(input.candidates))
    throw Error('SEO F127: invalid bounded legacy migration input');

  const destinations=new Set(input.targetRoutes.map(route));
  if(destinations.size!==input.targetRoutes.length||!destinations.has('/'))
    throw Error('SEO F127: duplicate or missing canonical homepage');
  const observed=input.legacyUrls.map(x=>oldUrl(x,input.siteDomain));
  if(new Set(input.legacyUrls).size!==observed.length)
    throw Error('SEO F127: duplicate legacy URLs');

  const index=new Map(observed.map((x,i)=>[x.url,i]));
  const mapped=new Set();
  const localeMismatchIndices=[];
  const aliasReviewIndices=[];
  let localeMismatchCount=0,aliasReviewCount=0,alreadyCanonicalCount=0;
  let httpCount=0,wwwCount=0,legacyEnglishPrefixCount=0;
  for(const item of observed){
    if(item.scheme==='http:')httpCount++;
    if(item.host.startsWith('www.'))wwwCount++;
    if(item.path==='/en-us'||item.path.startsWith('/en-us/'))legacyEnglishPrefixCount++;
    if(item.url==='https://'+input.siteDomain+item.path&&
       destinations.has(item.path))alreadyCanonicalCount++;
  }
  let candidateCount=0;
  for(const candidate of input.candidates){
    if(!exact(candidate,['fromUrl','toPath','status'])||
       candidate.status!==301||
       typeof candidate.fromUrl!=='string'||
       !index.has(candidate.fromUrl)||
       typeof candidate.toPath!=='string')
      throw Error('SEO F127: invalid 301 candidate mapping');
    const to=route(candidate.toPath);
    if(!destinations.has(to)||mapped.has(candidate.fromUrl))
      throw Error('SEO F127: duplicate or non-build redirect target');
    const source=observed[index.get(candidate.fromUrl)];
    if(source.url==='https://'+input.siteDomain+to)
      throw Error('SEO F127: canonical redirect loop or no-op');
    mapped.add(source.url);candidateCount++;
    if(locale(source.path)!==locale(to)){
      localeMismatchCount++;
      if(localeMismatchIndices.length<MAX_DIAGNOSTICS)
        localeMismatchIndices.push(index.get(source.url));
    }
    if(source.path==='/en-us'||source.path.startsWith('/en-us/')){
      aliasReviewCount++;
      if(aliasReviewIndices.length<MAX_DIAGNOSTICS)
        aliasReviewIndices.push(index.get(source.url));
    }
  }
  const unmappedIndices=[];
  let unmappedCount=0;
  for(let i=0;i<observed.length;i++){
    const e=observed[i];
    const stable=e.url==='https://'+input.siteDomain+e.path&&destinations.has(e.path);
    if(!stable&&!mapped.has(e.url)){
      unmappedCount++;
      if(unmappedIndices.length<MAX_DIAGNOSTICS)unmappedIndices.push(i);
    }
  }
  const blocked=unmappedCount>0||localeMismatchCount>0;
  return {
    contractVersion:'seo-f127-legacy-origin-locale-redirect-review-offline-v1',
    sourceType:'operator_supplied_legacy_urls_unverified',
    reviewStatus:blocked?'blocked':'human_redirect_review_required',
    summary:{
      legacyUrlCount:observed.length,canonicalTargetRouteCount:destinations.size,
      observedHttpUrls:httpCount,observedWwwUrls:wwwCount,
      observedLegacyEnglishUrls:legacyEnglishPrefixCount,
      alreadyCanonicalCount,reviewed301Candidates:candidateCount,
      unmappedCount,localeMismatchCount,legacyEnglishAliasReviewCount:aliasReviewCount,
      omittedUnmappedIndices:unmappedCount-unmappedIndices.length,
      omittedLocaleMismatchIndices:localeMismatchCount-localeMismatchIndices.length,
      omittedAliasReviewIndices:aliasReviewCount-aliasReviewIndices.length
    },
    unmappedIndices,localeMismatchIndices,aliasReviewIndices,
    contentEquivalenceVerified:false,
    redirectTargetsServedInProduction:false,
    originalHttpStatusesVerified:false,
    sourceGoogleSearchConsoleAuthenticated:false,
    backlinksChecked:false,
    liveRedirectsApplied:0,
    redirectsAuthorized:false,
    deploymentAuthorized:false,
    indexingAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_LEGACY_EQUIVALENCE_LIVE_REDIRECT_AND_STAGING_REVIEW'
  };
}
