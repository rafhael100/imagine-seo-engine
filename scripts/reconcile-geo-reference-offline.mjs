/**
 * SEO F110: three LOCAL files, no networking and no raw municipality data
 * emitted. The reference file must be supplied by an operator; no claim
 * about IBGE source authenticity is made by this script.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reconcileMunicipalDraftsWithReference}
  from '../src/geo-municipality-reference.mjs';

const [draftFile,inventoryFile,referenceFile,...extra]=process.argv.slice(2);
if(!draftFile||!inventoryFile||!referenceFile||extra.length||
   new Set([draftFile,inventoryFile,referenceFile]).size!==3){
  console.error('Usage: node scripts/reconcile-geo-reference-offline.mjs <drafts.json> <inventory.json> <municipalities.json>');
  process.exitCode=2;
}else try{
  const drafts=parseSafeJson(await readBoundedLocalText(draftFile,{
    maxBytes:512*1024
  }));
  const inventory=parseSafeJson(await readBoundedLocalText(inventoryFile,{
    maxBytes:10*1024*1024
  }));
  const reference=parseSafeJson(await readBoundedLocalText(referenceFile,{
    maxBytes:2*1024*1024
  }));
  console.log(JSON.stringify(reconcileMunicipalDraftsWithReference({
    screenInput:{draftBatchInput:drafts,inventoryInput:inventory},
    municipalityReference:reference
  }),null,2));
}catch(error){
  console.error('SEO municipal reference refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
