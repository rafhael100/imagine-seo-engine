/**
 * SEO F109: private, local-only pre-editorial candidate versus inventory gate.
 * No network, publication, IBGE authority or customer-facing output.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {screenMunicipalDraftsAgainstInventory}
  from '../src/geo-draft-inventory-gate.mjs';

const [draftsFile,inventoryFile,...extra]=process.argv.slice(2);
if(!draftsFile||!inventoryFile||extra.length||draftsFile===inventoryFile){
  console.error('Usage: node scripts/screen-geo-drafts-inventory-offline.mjs <drafts.json> <inventory.json>');
  process.exitCode=2;
}else try{
  const draftText=await readBoundedLocalText(draftsFile,{maxBytes:512*1024});
  const inventoryText=await readBoundedLocalText(inventoryFile,{
    maxBytes:10*1024*1024
  });
  const result=screenMunicipalDraftsAgainstInventory({
    draftBatchInput:parseSafeJson(draftText),
    inventoryInput:parseSafeJson(inventoryText)
  });
  console.log(JSON.stringify(result,null,2));
}catch(error){
  console.error('SEO draft screening refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
