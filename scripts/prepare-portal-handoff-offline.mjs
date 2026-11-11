import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {preparePortalSeoHandoff} from '../src/portal-handoff.mjs';
const [briefFile,tenantRef,propertyFingerprint,sourceRevision,...other]=process.argv.slice(2);
if(!briefFile||!tenantRef||!propertyFingerprint||!sourceRevision||other.length){
  console.error('Usage: node scripts/prepare-portal-handoff-offline.mjs brief.json tenantRef propertySha256 sourceCommitSha');
  process.exitCode=2;
}else try{
  const brief=parseSafeJson(await readBoundedLocalText(briefFile,{maxBytes:5*1024*1024}));
  console.log(JSON.stringify(preparePortalSeoHandoff({
    brief,tenantRef,propertyFingerprint,sourceRevision
  }),null,2));
}catch(error){
  console.error('SEO Portal handoff refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
