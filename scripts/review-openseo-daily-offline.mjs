/**
 * SEO-F104: local-only review of manually supplied OpenSEO daily GSC rows.
 * Never calls the provider, stores credentials or prints property/raw input.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewOfflineOpenSeoDailySnapshot}
  from '../src/openseo-daily-bridge.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/review-openseo-daily-offline.mjs <private-daily-snapshot.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{maxBytes:256*1024}));
  console.log(JSON.stringify(reviewOfflineOpenSeoDailySnapshot(input),null,2));
}catch(error){
  console.error('SEO OpenSEO daily review refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
