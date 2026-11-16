import {writeFile,rm} from 'node:fs/promises';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {importIbgeFileWithIndependentExpectedSha}
  from '../src/ibge-local-expected-digest.mjs';

const [rawFile,expectedRawSha256,referenceFile,receiptFile,...extra]=
  process.argv.slice(2);
if(!rawFile||!expectedRawSha256||!referenceFile||!receiptFile||
   extra.length||new Set([rawFile,referenceFile,receiptFile]).size!==3){
  console.error('Usage: node scripts/import-ibge-offline-sha256.mjs <raw-ibge.json> <independent-expected-sha256> <new-reference.json> <new-receipt.json>');
  process.exitCode=2;
}else{
  const created=[];
  try{
    const rawText=await readBoundedLocalText(rawFile,{maxBytes:8*1024*1024});
    const result=importIbgeFileWithIndependentExpectedSha({
      rawText,expectedSha256:expectedRawSha256
    });
    await writeFile(referenceFile,result.normalizedText,{
      flag:'wx',mode:0o600
    });
    created.push(referenceFile);
    await writeFile(receiptFile,JSON.stringify(result.receipt,null,2)+'\n',{
      flag:'wx',mode:0o600
    });
    created.push(receiptFile);
    console.log(JSON.stringify({
      contractVersion:result.receipt.contractVersion,
      normalizedEntries:result.receipt.referenceEntries,
      operatorProvidedSha256Matched:true,
      officialIbgeTransportVerified:false,
      classificationVerified:false,
      releaseAuthorized:false,
      filesCreated:2
    }));
  }catch(error){
    for(const file of created)
      await rm(file,{force:true}).catch(()=>{});
    console.error('SEO offline expected digest refused:',safeCliDiagnostic(error));
    process.exitCode=2;
  }
}
