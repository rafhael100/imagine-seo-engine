/**
 * SEO F122 — locale completeness for the operator-provided municipal page
 * inventory. No network, official municipality assertion, or publication.
 *
 * Reports contain only ordinal row indices, safe language tags and counts.
 * Neither city identifiers, page paths, slugs nor hashes leave this module.
 */
import {reviewMunicipalPageInventory} from './geo-inventory-review.mjs';

const REQUIRED_LOCALES=Object.freeze(['pt-BR','en-US','es-ES']);
const MAX_DIAGNOSTICS=200;
const prefixMatches=(locale,path)=>
  locale==='pt-BR' ? !path.startsWith('/en/')&&!path.startsWith('/es/') :
  locale==='en-US' ? path.startsWith('/en/') : path.startsWith('/es/');

/**
 * The full PT-BR / EN-US / ES-ES coverage contract is deliberate: missing
 * language pages are review blockers, not permission to generate translations.
 * Caller is responsible for selecting the inventory and official source.
 */
export function reviewMunicipalI18nParity(inventoryInput){
  // F108 validates exact object shapes, dense arrays, codes, locale, path
  // and digest syntax, including rejection of accessors/unknown fields.
  const validated=reviewMunicipalPageInventory(inventoryInput);
  const groups=new Map();
  const wrongLocalePrefixIndices=[];
  let wrongLocalePrefixCount=0;
  for(let i=0;i<inventoryInput.entries.length;i++){
    const e=inventoryInput.entries[i];
    // Delimiter cannot appear in F108's service slug or IBGE code.
    const groupKey=e.serviceSlug+'|'+e.ibgeCode;
    let group=groups.get(groupKey);
    if(!group){
      group={firstIndex:i,firstState:e.state,localeSet:new Set(),stateMismatch:false};
      groups.set(groupKey,group);
    }
    group.localeSet.add(e.locale);
    if(e.state!==group.firstState)group.stateMismatch=true;
    if(!prefixMatches(e.locale,e.canonicalPath)){
      wrongLocalePrefixCount++;
      if(wrongLocalePrefixIndices.length<MAX_DIAGNOSTICS)
        wrongLocalePrefixIndices.push(i);
    }
  }
  const incompleteGroups=[],stateMismatchIndices=[];
  let incompleteGroupCount=0,missingLocaleSlots=0;
  let stateMismatchGroups=0,completeGroupCount=0;
  for(const group of groups.values()){
    const missing=REQUIRED_LOCALES.filter(locale=>!group.localeSet.has(locale));
    if(missing.length){
      incompleteGroupCount++;
      missingLocaleSlots+=missing.length;
      if(incompleteGroups.length<MAX_DIAGNOSTICS)
        incompleteGroups.push({firstInventoryIndex:group.firstIndex,missingLocales:missing});
    }else completeGroupCount++;
    if(group.stateMismatch){
      stateMismatchGroups++;
      if(stateMismatchIndices.length<MAX_DIAGNOSTICS)
        stateMismatchIndices.push(group.firstIndex);
    }
  }
  const blocked=incompleteGroupCount>0||stateMismatchGroups>0||
    wrongLocalePrefixCount>0||validated.summary.conflictCount>0;
  return {
    contractVersion:'seo-municipal-i18n-parity-offline-v1',
    reviewStatus:blocked?'corrections_required':'human_multilingual_editorial_review_required',
    summary:{
      inspectedEntries:validated.summary.inspectedEntries,
      serviceMunicipalityGroups:groups.size,
      completeLocaleGroups:completeGroupCount,
      incompleteLocaleGroups:incompleteGroupCount,
      missingLocaleSlots,
      stateMismatchGroups,
      wrongLocalePrefixCount,
      inventoryConflicts:validated.summary.conflictCount,
      omittedIncompleteGroups:incompleteGroupCount-incompleteGroups.length,
      omittedStateMismatchGroups:stateMismatchGroups-stateMismatchIndices.length,
      omittedWrongLocaleIndices:wrongLocalePrefixCount-wrongLocalePrefixIndices.length
    },
    incompleteGroups,
    stateMismatchIndices,
    wrongLocalePrefixIndices,
    requiredLocales:[...REQUIRED_LOCALES],
    officialIbgeVerified:false,
    trueTranslationQualityVerified:false,
    businessLocalPresenceVerified:false,
    humanEditorialApprovalVerified:false,
    publicBuildVerified:false,
    googleIndexingVerified:false,
    publicationAuthorized:false,
    indexingAuthorized:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_OFFICIAL_SOURCE_LOCAL_RELEVANCE_EDITORIAL_AND_STAGING'
  };
}
