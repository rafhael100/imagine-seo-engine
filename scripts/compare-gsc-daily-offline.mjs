/**
 * SEO-F55 — no-network, private local two-window Search Console comparison.
 * Never prints raw input or retains exported query/page contents.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {compareOfflineGscDailyPeriods} from '../src/gsc-daily-compare.mjs';

const [file,...unexpected]=process.argv.slice(2);
if(!file||unexpected.length){
  console.error('Usage: node scripts/compare-gsc-daily-offline.mjs <private-two-periods.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{maxBytes:1024*1024}));
  console.log(JSON.stringify(compareOfflineGscDailyPeriods(input),null,2));
}catch(error){
  console.error('SEO GSC daily comparison refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
