/**
 * SEO F109: joins ONLY original F107 draft batches and original F108
 * operator-supplied inventory inputs. Prior summaries cannot be forged.
 * Zero automatic publishing, no indexation, external IBGE or Google network.
 */
import {createHash} from 'node:crypto';
import {reviewMunicipalSeoDraftBatch} from './geo-batch-preflight.mjs';
import {reviewMunicipalPageInventory} from './geo-inventory-review.mjs';

const FIELDS=['draftBatchInput','inventoryInput'];
function exactObject(v,fields){
  if(v===null||typeof v!=='object'||Array.isArray(v)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const keys=Reflect.ownKeys(v);
  return keys.length===fields.length&&keys.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}

/**
 * A candidate F107 draft without locale is strictly treated as PT-BR
 * for the inventory-key comparison. Never infer another locale.
 */
export function screenMunicipalDraftsAgainstInventory(input){
  if(!exactObject(input,FIELDS))
    throw Error('SEO F109: original local draft and inventory inputs required');

  // Recompute the two existing review contracts. No operator-supplied
  // "already approved" output, authorization flag, or summary is accepted.
  const batch=reviewMunicipalSeoDraftBatch(input.draftBatchInput);
  const inventory=reviewMunicipalPageInventory(input.inventoryInput);

  const keys=new Set(),hashes=new Set();
  for(const e of input.inventoryInput.entries){
    keys.add(e.locale+'|'+e.serviceSlug+'|'+e.ibgeCode);
    hashes.add(e.contentSha256);
  }

  const inventoryHasConflicts=inventory.summary.conflictCount>0;
  const reviews=batch.items.map((item,i)=>{
    const original=input.draftBatchInput.candidates[i];
    const key='pt-BR|'+original.serviceSlug+'|'+original.ibgeCode;
    const bodyDigest=createHash('sha256')
      .update(original.localContent,'utf8').digest('hex');
    const reasons=[...item.reasons];
    if(keys.has(key))reasons.push('municipality_service_locale_already_in_inventory');
    if(hashes.has(bodyDigest))reasons.push('identical_draft_body_in_inventory');
    if(inventoryHasConflicts)
      reasons.push('source_inventory_contains_unresolved_collisions');
    const blocked=reasons.length>0;
    return {
      draftIndex:i,
      status:blocked?'blocked':'human_editorial_review_required',
      reasons:[...new Set(reasons)],
      maximumLocalSimilarity:item.maximumLocalSimilarity,
      indexationAllowed:false,
      publishingAllowed:false
    };
  });

  const blocked=reviews.filter(x=>x.status==='blocked').length;
  return {
    contractVersion:'seo-municipal-draft-inventory-joined-offline-v1',
    sourceType:'operator_supplied_drafts_inventory_not_provider_verified',
    localeAssumption:'pt-BR_draft_only',
    summary:{
      reviewedDrafts:reviews.length,
      inventoryEntries:inventory.summary.inspectedEntries,
      inventoryConflicts:inventory.summary.conflictCount,
      blockedDrafts:blocked,
      awaitingHumanEditorialReview:reviews.length-blocked,
    },
    reviews,
    globalInventoryComplete:false,
    officialIbgeVerified:false,
    localityServiceAvailabilityVerified:false,
    demandIndependentlyVerified:false,
    contentMatchedToPublishedPages:false,
    semanticDoorwayRiskEliminated:false,
    indexationAllowed:false,
    automatedPublication:false,
    customerDisplayAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_HUMAN_EDITORIAL_IBGE_INVENTORY_AND_PUBLICATION_GATES',
    caveats:[
      'Review status does not establish a national inventory of all published pages.',
      'Draft body SHA-256 is compared against operator-declared inventory hashes only.',
      'Passing this preflight is not evidence of IBGE correctness, service availability, original local content or customer authorization.'
    ]
  };
}
