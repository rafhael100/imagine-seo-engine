/**
 * SEO-F73 — local-only CLI for validating a query/page batch against
 * its readonly F71 request blueprint, without a Google or Portal connection.
 * Never print operator file paths, original search terms or page URLs.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewOfflineGscQueryPagePlannedBatch}
  from '../src/gsc-query-page-plan-binding.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/review-gsc-planned-query-page-offline.mjs <private-plan-and-pages.json>');
  process.exitCode=2;
}else try{
  const raw=await readBoundedLocalText(file,{maxBytes:10*1024*1024});
  const input=parseSafeJson(raw);
  const report=reviewOfflineGscQueryPagePlannedBatch(input);
  console.log(JSON.stringify(report,null,2));
}catch(error){
  console.error('SEO GSC planned batch refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
