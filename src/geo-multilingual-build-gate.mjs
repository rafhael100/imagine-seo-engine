/**
 * SEO F123 — one offline decision combining the F122 three-language inventory
 * parity and F114/F117 ACTUAL compiled HTML checks. No publication authority.
 *
 * Snapshot the already-validated inventory before awaiting filesystem work,
 * so the two independent checks cannot inspect different mutable manifests.
 */
import {reviewMunicipalI18nParity} from './geo-i18n-parity-review.mjs';
import {reviewMunicipalStaticBuild} from './geo-static-build-review.mjs';
import {reviewMunicipalHreflangCompleteness} from './geo-hreflang-completeness.mjs';

function exactInput(input){
  if(input===null||typeof input!=='object'||Array.isArray(input)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(input)))
    return false;
  const keys=Reflect.ownKeys(input);
  return keys.length===3&&keys.every(key=>{
    if(typeof key!=='string'||!['inventoryInput','buildDirectory','siteUrl'].includes(key))
      return false;
    const descriptor=Object.getOwnPropertyDescriptor(input,key);
    return descriptor?.enumerable===true&&Object.hasOwn(descriptor,'value');
  });
}
export async function reviewMunicipalMultilingualBuild(input){
  if(!exactInput(input)||
     typeof input.buildDirectory!=='string'||
     typeof input.siteUrl!=='string')
    throw Error('SEO F123: invalid offline multilingual build input');

  // Synchronous F108/F122 validation precedes the first await.
  const parity=reviewMunicipalI18nParity(input.inventoryInput);
  const entries=input.inventoryInput.entries.map(e=>({
    serviceSlug:e.serviceSlug,ibgeCode:e.ibgeCode,state:e.state,
    locale:e.locale,canonicalPath:e.canonicalPath,contentSha256:e.contentSha256
  }));
  const pinned={
    inventoryInput:{sourceType:'operator_local_inventory_unverified',entries},
    buildDirectory:input.buildDirectory,
    siteUrl:input.siteUrl
  };
  const staticBuild=await reviewMunicipalStaticBuild(pinned);
  // F124 adds the mandatory 3x3 hreflang check omitted by optional
  // reciprocity checks whenever all HTML pages omit their declarations.
  const hreflang=await reviewMunicipalHreflangCompleteness(pinned);
  const blocked=parity.reviewStatus==='corrections_required'||
    staticBuild.reviewStatus==='blocked'||hreflang.reviewStatus==='blocked';
  return {
    contractVersion:'seo-municipal-multilingual-build-gate-offline-v1',
    reviewStatus:blocked?'blocked':'human_independent_review_required',
    summary:{
      inspectedEntries:parity.summary.inspectedEntries,
      serviceMunicipalityGroups:parity.summary.serviceMunicipalityGroups,
      incompleteLocaleGroups:parity.summary.incompleteLocaleGroups,
      missingLocaleSlots:parity.summary.missingLocaleSlots,
      stateMismatchGroups:parity.summary.stateMismatchGroups,
      wrongLocalePrefixCount:parity.summary.wrongLocalePrefixCount,
      inventoryConflicts:parity.summary.inventoryConflicts,
      auditedBuildPages:staticBuild.summary.auditedBuildPages,
      expectedRoutesMissing:staticBuild.summary.expectedRoutesMissing,
      expectedRoutesWrongLocale:staticBuild.summary.expectedRoutesWrongLocale,
      technicalErrors:staticBuild.summary.technicalErrors,
      privateEditorialPreviewLeaks:staticBuild.summary.privateEditorialPreviewLeaks,
      missingHreflangLinks:hreflang.summary.missingHreflangLinks,
      wrongHreflangTargets:hreflang.summary.wrongHreflangTargets,
      ambiguousHreflangAliases:hreflang.summary.ambiguousAliases
    },
    localeParity:parity,
    staticBuild,
    hreflangCompleteness:hreflang,
    auditedRealLocalFiles:true,
    actualPublishedSiteVerified:false,
    verifiedOfficialIbge:false,
    realTranslationQualityVerified:false,
    realBusinessLocalPresenceVerified:false,
    independentlyApprovedEditorialContent:false,
    trustedProductionSignerVerified:false,
    customerDisplayAuthorized:false,
    publicationAuthorized:false,
    indexingAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_SOURCE_EDITORIAL_SIGNER_STAGING_AND_HUMAN_APPROVAL'
  };
}
