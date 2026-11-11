/**
 * SEO-F66 — private local CLI to compare two original query/page exports.
 * No request, token, raw query, URL or private file path is ever emitted.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {compareOfflineGscQueryPageOverlapPeriods}
  from '../src/gsc-query-page-overlap-trend.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/compare-gsc-overlap-offline.mjs <private-two-periods.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{maxBytes:10*1024*1024}));
  console.log(JSON.stringify(compareOfflineGscQueryPageOverlapPeriods(input),null,2));
}catch(error){
  console.error('SEO GSC overlap comparison refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
