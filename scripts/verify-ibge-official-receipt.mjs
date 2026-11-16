import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {verifyIbgeSourceReceipt} from '../src/ibge-source-receipt-review.mjs';
const [referenceFile,receiptFile,...extra]=process.argv.slice(2);
if(!referenceFile||!receiptFile||extra.length||referenceFile===receiptFile){
  console.error('Usage: node scripts/verify-ibge-official-receipt.mjs <reference.json> <receipt.json>');
  process.exitCode=2;
}else try{
  const referenceText=await readBoundedLocalText(referenceFile,{maxBytes:2*1024*1024});
  const receipt=parseSafeJson(await readBoundedLocalText(receiptFile,{maxBytes:8*1024}));
  console.log(JSON.stringify(verifyIbgeSourceReceipt(referenceText,receipt),null,2));
}catch(error){
  console.error('SEO IBGE receipt refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
