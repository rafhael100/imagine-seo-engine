/**
 * SEO F124 — require complete, correct and unambiguous 3x3 hreflang clusters
 * on actual local HTML, not merely reciprocal links when some are present.
 *
 * The raw static auditor returns pathful evidence ONLY by explicit opt-in.
 * This public result strips paths, municipality codes, slugs and digests.
 */
import {auditStaticSite} from './audit-static.mjs';
import {reviewMunicipalI18nParity} from './geo-i18n-parity-review.mjs';

const LOCALES=['pt-BR','en-US','es-ES'];
const ALIASES={'pt-BR':['pt-br'],'en-US':['en','en-us'],'es-ES':['es','es-es']};
const LIMIT=200;
function exactInput(v){
  if(v===null||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===3&&keys.every(k=>{
    if(typeof k!=='string'||!['inventoryInput','buildDirectory','siteUrl'].includes(k))
      return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
export async function reviewMunicipalHreflangCompleteness(input){
  if(!exactInput(input) ||
     typeof input.buildDirectory!=='string'||typeof input.siteUrl!=='string')
    throw Error('SEO F124: invalid local hreflang review input');
  const parity=reviewMunicipalI18nParity(input.inventoryInput);
  if(parity.summary.inspectedEntries>20000)
    throw Error('SEO F124: at most 20000 expected pages in one build');
  // Snapshot all validated fields before beginning asynchronous file reads.
  const entries=input.inventoryInput.entries.map(e=>({
    serviceSlug:e.serviceSlug,ibgeCode:e.ibgeCode,state:e.state,
    locale:e.locale,canonicalPath:e.canonicalPath,contentSha256:e.contentSha256
  }));
  const audit=await auditStaticSite(input.buildDirectory,{
    siteUrl:input.siteUrl,strictPublicHead:true,
    allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
    checkHreflang:true,includeHreflangDeclarations:true
  });
  if(!Array.isArray(audit.routeAlternates)||
     audit.routeAlternates.length!==audit.summary.pages)
    throw Error('SEO F124: incomplete raw local hreflang evidence');
  const build=new Map(audit.routeAlternates.map(p=>[
    p.path,new Map(p.alternates.map(alt=>[alt.language,alt.path]))
  ]));
  if(build.size!==audit.summary.pages)
    throw Error('SEO F124: duplicate audited canonical routes');
  const groups=new Map();
  for(let i=0;i<entries.length;i++){
    const e=entries[i];
    const key=e.serviceSlug+'|'+e.ibgeCode;
    let group=groups.get(key);
    if(!group){
      group={firstInventoryIndex:i,byLocale:new Map()};
      groups.set(key,group);
    }
    if(!group.byLocale.has(e.locale))group.byLocale.set(e.locale,e.canonicalPath);
  }
  const findings=[];
  let missingHreflangLinks=0,wrongHreflangTargets=0,ambiguousAliases=0;
  let missingAuditedRoutes=0,completeGroupsInspected=0;
  let totalRequiredLinks=0;
  const add=(first,sourceLocale,targetLocale,code)=>{
    if(findings.length<LIMIT)
      findings.push({firstInventoryIndex:first,sourceLocale,targetLocale,code});
    if(code==='missing_hreflang')missingHreflangLinks++;
    if(code==='wrong_hreflang_target')wrongHreflangTargets++;
    if(code==='ambiguous_hreflang_alias')ambiguousAliases++;
    if(code==='missing_audited_route')missingAuditedRoutes++;
  };
  for(const group of groups.values()){
    if(!LOCALES.every(locale=>group.byLocale.has(locale)))continue;
    completeGroupsInspected++;
    for(const sourceLocale of LOCALES){
      const declaration=build.get(group.byLocale.get(sourceLocale));
      if(!declaration){
        missingAuditedRoutes++;
        if(findings.length<LIMIT) findings.push({
          firstInventoryIndex:group.firstInventoryIndex,
          sourceLocale,targetLocale:sourceLocale,code:'missing_audited_route'
        });
        continue;
      }
      for(const targetLocale of LOCALES){
        totalRequiredLinks++;
        const matched=ALIASES[targetLocale].filter(name=>declaration.has(name));
        if(matched.length===0)
          add(group.firstInventoryIndex,sourceLocale,targetLocale,'missing_hreflang');
        else if(matched.length>1)
          add(group.firstInventoryIndex,sourceLocale,targetLocale,'ambiguous_hreflang_alias');
        else if(declaration.get(matched[0])!==group.byLocale.get(targetLocale))
          add(group.firstInventoryIndex,sourceLocale,targetLocale,'wrong_hreflang_target');
      }
    }
  }
  const errors=missingHreflangLinks+wrongHreflangTargets+ambiguousAliases+
    missingAuditedRoutes+audit.summary.errors+
    (parity.reviewStatus==='corrections_required'?1:0);
  return {
    contractVersion:'seo-municipal-hreflang-completeness-offline-v1',
    reviewStatus:errors?'blocked':'human_independent_review_required',
    summary:{
      inspectedEntries:entries.length,
      completeLocaleGroupsInspected:completeGroupsInspected,
      incompleteLocaleGroups:parity.summary.incompleteLocaleGroups,
      missingLocaleSlots:parity.summary.missingLocaleSlots,
      requiredHreflangLinks:completeGroupsInspected*LOCALES.length*LOCALES.length,
      actuallyInspectedLinks:totalRequiredLinks,
      missingHreflangLinks,wrongHreflangTargets,ambiguousAliases,
      missingAuditedRoutes,technicalErrors:audit.summary.errors,
      omittedFindings:missingHreflangLinks+wrongHreflangTargets+
        ambiguousAliases+missingAuditedRoutes-findings.length
    },
    findings,
    htmlActuallyAudited:true,
    officialSourceVerified:false,
    realTranslationQualityVerified:false,
    publicDeploymentVerified:false,
    indexingAuthorized:false,
    publicationAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_EDITING_SOURCE_STAGING_SECURITY_AND_HUMAN_REVIEW'
  };
}
