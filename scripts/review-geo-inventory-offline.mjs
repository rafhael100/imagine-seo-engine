/**
 * F108: local-only inventory review. Never sends file bytes to a provider
 * and never outputs municipality codes, routes or SHA-256 values.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewMunicipalPageInventory} from '../src/geo-inventory-review.mjs';

const [file,...rest]=process.argv.slice(2);
if(!file||rest.length){
  console.error('Usage: node scripts/review-geo-inventory-offline.mjs <input.json>');
  process.exitCode=2;
}else try{
  const raw=await readBoundedLocalText(file,{maxBytes:16*1024*1024});
  const inventory=parseSafeJson(raw);
  console.log(JSON.stringify(reviewMunicipalPageInventory(inventory),null,2));
}catch(error){
  console.error('SEO inventory refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
