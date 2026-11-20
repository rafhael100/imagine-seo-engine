/**
 * SEO-F80 — internal review-only privacy-gated display contract CLI.
 * Reads original operator-supplied data, recomputes via F79/F74/F72 and
 * emits only a sanitized static view model. No network, grants or publication.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {prepareOfflinePortalQueryPageDisplayModel}
  from '../src/portal-query-page-display-model.mjs';

const [path,...extra]=process.argv.slice(2);
if(!path||extra.length){
  console.error('Usage: node scripts/prepare-portal-query-page-display-offline.mjs <private-evidence.json>');
  process.exitCode=2;
}else try{
  const data=parseSafeJson(await readBoundedLocalText(path,{maxBytes:10*1024*1024}));
  const model=prepareOfflinePortalQueryPageDisplayModel(data);
  console.log(JSON.stringify(model,null,2));
}catch(error){
  console.error('SEO Portal query/page display refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
