/**
 * F117. Operator-initiated, narrow public API download; only official IBGE
 * HTTPS host, no dynamic URLs, no credentials or automatic publication.
 * Exclusive output files are intended for private local review/CI storage.
 */
import {writeFile,rm} from 'node:fs/promises';
import {captureOfficialIbgeReference}
  from '../src/ibge-official-https-capture.mjs';
import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';

const [referencePath,receiptPath,...extra]=process.argv.slice(2);
if(!referencePath||!receiptPath||extra.length||
   referencePath===receiptPath){
  console.error('Usage: node scripts/capture-official-ibge-reference.mjs <new-reference.json> <new-receipt.json>');
  process.exitCode=2;
}else{
  const created=[];
  try{
    const capture=await captureOfficialIbgeReference();
    const receipt=JSON.stringify(capture.provenance,null,2)+'\n';
    await writeFile(referencePath,capture.normalizedText,{
      flag:'wx',mode:0o600
    });
    created.push(referencePath);
    await writeFile(receiptPath,receipt,{flag:'wx',mode:0o600});
    created.push(receiptPath);
    console.log(JSON.stringify({
      contractVersion:capture.provenance.contractVersion,
      officialHttpsHostnameContacted:true,
      entries:capture.provenance.referenceEntries,
      rawSha256:capture.provenance.rawJsonSha256,
      referenceSha256:capture.provenance.normalizedReferenceSha256,
      sourceEditionVerified:false,
      allMunicipalitiesCovered:false,
      filesCreated:2,
      publicationAuthorized:false,
      releaseStatus:capture.provenance.releaseStatus
    }));
  }catch(error){
    // If a write fails, never leave a half-pair that can be mistaken for
    // a verified source record. Only unlink paths created by this process.
    for(const path of created)
      await rm(path,{force:true}).catch(()=>{});
    console.error('SEO official IBGE capture refused:',safeCliDiagnostic(error));
    process.exitCode=2;
  }
}
