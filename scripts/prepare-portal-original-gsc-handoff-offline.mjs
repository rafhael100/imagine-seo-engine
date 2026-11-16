/**
 * SEO-F88 — original GSC evidence → privacy-gated Portal handoff (offline).
 * JSON must contain audit, previous/current ORIGINAL query exports and scope.
 * No credentials, API access, publication or data persistence.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {prepareOfflinePortalSeoFromOriginalGsc}
  from '../src/portal-original-gsc-handoff.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/prepare-portal-original-gsc-handoff-offline.mjs <private-original-evidence.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{
    maxBytes:10*1024*1024
  }));
  console.log(JSON.stringify(prepareOfflinePortalSeoFromOriginalGsc(input),null,2));
}catch(error){
  console.error('SEO original Portal handoff refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
