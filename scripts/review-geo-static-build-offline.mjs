/**
 * F114: local-only build-versus-inventory review. The command does not
 * deploy or make external requests. A zero exit code is NOT release approval.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewMunicipalStaticBuild} from '../src/geo-static-build-review.mjs';

const [inventoryFile,buildDirectory,siteUrl,...extra]=process.argv.slice(2);
if(!inventoryFile||!buildDirectory||!siteUrl||extra.length){
  console.error('Usage: node scripts/review-geo-static-build-offline.mjs <inventory.json> <local-dist> <https-origin>');
  process.exitCode=2;
}else try {
  const inventoryInput=parseSafeJson(await readBoundedLocalText(inventoryFile,{
    maxBytes:10*1024*1024
  }));
  const result=await reviewMunicipalStaticBuild({
    inventoryInput,buildDirectory,siteUrl
  });
  console.log(JSON.stringify(result,null,2));
  // Blocks the hypothetical release gate but never grants production power.
  if(result.reviewStatus==='blocked')process.exitCode=1;
}catch(error){
  console.error('SEO static build review refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
