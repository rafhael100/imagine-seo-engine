/**
 * SEO-F105 — local, bounded, two-file OpenSEO daily snapshot comparison.
 * No provider access and no printing of input, paths, URLs or secrets.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {compareOfflineOpenSeoDailyPeriods}
  from '../src/openseo-daily-compare.mjs';

const [previousFile,currentFile,...extra]=process.argv.slice(2);
if(!previousFile||!currentFile||extra.length){
  console.error('Usage: node scripts/compare-openseo-daily-offline.mjs <previous.json> <current.json>');
  process.exitCode=2;
}else try{
  const previous=await readBoundedLocalText(previousFile,{
    maxBytes:256*1024,withIdentity:true
  });
  const current=await readBoundedLocalText(currentFile,{
    maxBytes:256*1024,withIdentity:true
  });
  if(previous.device===current.device&&previous.inode===current.inode)
    throw Error('SEO F105: distinct source files required');
  const comparison=compareOfflineOpenSeoDailyPeriods({
    previous:parseSafeJson(previous.text),
    current:parseSafeJson(current.text)
  });
  console.log(JSON.stringify(comparison,null,2));
}catch(error){
  console.error('SEO OpenSEO daily comparison refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
