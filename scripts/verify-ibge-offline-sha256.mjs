import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {verifyOfflineIbgeFileReceipt}
  from '../src/ibge-local-expected-digest.mjs';
const [rawFile,referenceFile,receiptFile,...extra]=process.argv.slice(2);
if(!rawFile||!referenceFile||!receiptFile||extra.length||
   new Set([rawFile,referenceFile,receiptFile]).size!==3){
  console.error('Usage: node scripts/verify-ibge-offline-sha256.mjs <raw-ibge.json> <reference.json> <receipt.json>');
  process.exitCode=2;
}else try{
  const rawText=await readBoundedLocalText(rawFile,{maxBytes:8*1024*1024});
  const referenceText=await readBoundedLocalText(referenceFile,{maxBytes:2*1024*1024});
  const receipt=parseSafeJson(await readBoundedLocalText(receiptFile,{
    maxBytes:8*1024
  }));
  console.log(JSON.stringify(verifyOfflineIbgeFileReceipt({
    rawText,referenceText,receipt
  }),null,2));
}catch(error){
  console.error('SEO offline receipt refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
