/**
 * SEO-F111 private local conversion. A copy of an IBGE-style export must
 * already exist on disk; this script NEVER contacts any network endpoint.
 *
 * Output uses exclusive creation and restrictive file permissions.
 * The converted directory remains UNVERIFIED until source provenance is
 * independently checked by an authorized operator.
 */
import {writeFile} from 'node:fs/promises';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {normalizeLocallySuppliedIbgeMunicipalities}
  from '../src/ibge-localities-offline-import.mjs';

const [sourceFile,outputFile,...extra]=process.argv.slice(2);
if(!sourceFile||!outputFile||extra.length||sourceFile===outputFile){
  console.error('Usage: node scripts/import-ibge-localities-offline.mjs <source.json> <reference.json>');
  process.exitCode=2;
}else try{
  const raw=parseSafeJson(await readBoundedLocalText(sourceFile,{
    maxBytes:8*1024*1024
  }));
  const result=normalizeLocallySuppliedIbgeMunicipalities(raw);
  const data=JSON.stringify(result,null,2)+'\n';
  if(Buffer.byteLength(data,'utf8')>2*1024*1024)
    throw Error('SEO F111: normalized reference exceeds bounded output');
  await writeFile(outputFile,data,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({
    importedRows:result.entries.length,
    ibgeOriginAuthenticated:false,
    destinationCreated:true,
    publicPublicationAuthorized:false,
    releaseStatus:'HOLD_SOURCE_PROVENANCE_AND_EDITORIAL_REVIEW'
  }));
}catch(error){
  console.error('SEO municipal import refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
