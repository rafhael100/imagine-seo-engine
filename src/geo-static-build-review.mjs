/**
 * SEO F114: actually audit a LOCAL static build, then reconcile it with a
 * declared municipal inventory. No network, publication, authentication,
 * sitemap generation, remote Google metrics or deployment.
 *
 * Audit errors/warnings carry filenames for local developer debugging;
 * this result intentionally strips every URL, path, page body and digest.
 */
import {auditStaticSite} from './audit-static.mjs';
import {reviewMunicipalPageInventory} from './geo-inventory-review.mjs';

const MAX_AUDITED_PAGES=20000,MAX_DIAGNOSTIC_TYPES=120,MAX_MISSING_INDICES=200;
function sanitizedTypes(findings){
  const byType=new Map();
  for(const finding of findings){
    const code=typeof finding.type==='string'&&
      /^[a-z][a-z0-9_]{0,79}$/.test(finding.type)
      ?finding.type:'other_audit_finding';
    byType.set(code,(byType.get(code)??0)+1);
  }
  return [...byType].sort(([a],[b])=>a.localeCompare(b))
    .slice(0,MAX_DIAGNOSTIC_TYPES)
    .map(([code,count])=>({code,count}));
}
const exactInput=v=>{
  if(v===null||typeof v!=='object'||Array.isArray(v)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  if(keys.length!==3)return false;
  const allowed=['inventoryInput','buildDirectory','siteUrl'];
  return keys.every(k=>typeof k==='string'&&allowed.includes(k)&&
    Object.getOwnPropertyDescriptor(v,k)?.enumerable===true&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value'));
};

/**
 * Inspects the operator supplied inventory and the exact local build.
 * Missing pages or any build audit ERROR block review. No clean result
 * becomes permission to publish: inventory and site may be incomplete.
 */
export async function reviewMunicipalStaticBuild(input){
  if(!exactInput(input) ||
    typeof input.buildDirectory!=='string' ||
    input.buildDirectory.length<1||input.buildDirectory.length>2048 ||
    typeof input.siteUrl!=='string' ||
    input.siteUrl.length<10||input.siteUrl.length>220)
    throw Error('SEO F114: invalid offline build review input');

  const inventory=reviewMunicipalPageInventory(input.inventoryInput);
  if(inventory.summary.inspectedEntries>MAX_AUDITED_PAGES)
    throw Error('SEO F114: static build auditor supports at most 20000 inventory rows');

  // The existing auditor enforces a bounded local build crawl, correct
  // canonical/OG URLs, robots, sitemap, hreflang and private-preview leak
  // detection. It never issues a network request to the declared origin.
  const audit=await auditStaticSite(input.buildDirectory,{
    siteUrl:input.siteUrl,strictPublicHead:true,
    allowedLanguages:['pt-BR','en','es','en-US','es-ES'],checkHreflang:true
  });
  if(audit.routes.length!==audit.summary.pages)
    throw Error('SEO F114: inconsistent static audit route inventory');

  const actual=new Set(audit.routes);
  // F117: the Astro Comercial currently emits <html lang="en"> and "es".
  // The declared manifest uses canonical BCP47 locales en-US / es-ES.
  // An exact route match is NOT enough: a wrong-language build is blocked.
  const localeAliases=Object.freeze({
    'pt-BR':['pt-br'],'en-US':['en','en-us'],'es-ES':['es','es-es']
  });
  if(!Array.isArray(audit.routeLocales) ||
     audit.routeLocales.length!==audit.summary.pages)
    throw Error('SEO F117: audited page locale evidence required');
  const auditedLocales=new Map(audit.routeLocales.map(x=>[x.path,x.language]));
  if(auditedLocales.size!==audit.summary.pages)
    throw Error('SEO F117: duplicate audited locale paths');
  const missingIndices=[],wrongLocaleIndices=[];
  let missingCount=0,matchedCount=0,wrongLocaleCount=0;
  for(const [index,page] of input.inventoryInput.entries.entries()){
    if(actual.has(page.canonicalPath)){
      matchedCount++;
      if(!localeAliases[page.locale].includes(auditedLocales.get(page.canonicalPath))){
        wrongLocaleCount++;
        if(wrongLocaleIndices.length<MAX_MISSING_INDICES)
          wrongLocaleIndices.push(index);
      }
    }else{
      missingCount++;
      if(missingIndices.length<MAX_MISSING_INDICES)
        missingIndices.push(index);
    }
  }
  const declaredPaths=new Set(input.inventoryInput.entries.map(e=>e.canonicalPath));
  let otherSitePages=0;
  for(const path of actual)if(!declaredPaths.has(path))otherSitePages++;

  const draftLeaks=audit.errors.filter(e=>
    e.type==='private_editorial_preview_in_public_build').length;
  const failed=inventory.summary.conflictCount>0||
    missingCount>0||wrongLocaleCount>0||audit.summary.errors>0;

  return {
    contractVersion:'seo-municipal-static-build-reconciliation-offline-v1',
    sourceType:'operator_supplied_inventory_and_local_build_unverified',
    reviewStatus:failed?'blocked':'human_independent_review_required',
    summary:{
      inventoryEntries:inventory.summary.inspectedEntries,
      inventoryConflicts:inventory.summary.conflictCount,
      auditedBuildPages:audit.summary.pages,
      expectedRoutesFound:matchedCount,
      expectedRoutesMissing:missingCount,
      expectedRoutesWrongLocale:wrongLocaleCount,
      omittedMissingRouteIndices:missingCount-missingIndices.length,
      omittedWrongLocaleIndices:wrongLocaleCount-wrongLocaleIndices.length,
      otherSitePages,
      technicalErrors:audit.summary.errors,
      technicalWarnings:audit.summary.warnings,
      privateEditorialPreviewLeaks:draftLeaks
    },
    missingInventoryIndices:missingIndices,
    wrongLocaleInventoryIndices:wrongLocaleIndices,
    technicalErrorTypes:sanitizedTypes(audit.errors),
    technicalWarningTypes:sanitizedTypes(audit.warnings),
    auditedRealLocalFiles:true,
    confirmedPublishedSite:false,
    authenticatedIbgeReference:false,
    realContentDigestVerified:false,
    inventoryCompletenessVerified:false,
    editorialApprovalVerified:false,
    productionCanonicalVerified:false,
    customerDisplayAuthorized:false,
    deploymentAuthorized:false,
    indexingAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_INDEPENDENT_EDITORIAL_SOURCE_AND_STAGING_GATES',
    limitations:[
      'A local build is not evidence that the same files are currently deployed to the public domain.',
      'Routes present in the build are matched by exact canonical paths and declared HTML root languages; draft content hashes are not verified here.',
      'The inventory may omit municipal or other public pages; pages outside this inventory are counted but not assumed erroneous.',
      'Even a clean report requires authenticated source, editorial review, staging, security testing and human release approval.'
    ]
  };
}
