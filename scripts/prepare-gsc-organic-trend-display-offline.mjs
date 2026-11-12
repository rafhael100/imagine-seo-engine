/**
 * SEO-F86 — privacy-gated GSC trend display CLI for original two-window JSON.
 * Offline, private local input only; never grants OAuth or customer access.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {prepareOfflineGscOrganicTrendDisplay}
  from '../src/gsc-organic-trend-display.mjs';

const [path,...extra]=process.argv.slice(2);
if(!path||extra.length){
  console.error('Usage: node scripts/prepare-gsc-organic-trend-display-offline.mjs <private-two-periods.json>');
  process.exitCode=2;
}else try{
  const text=await readBoundedLocalText(path,{maxBytes:10*1024*1024});
  const source=parseSafeJson(text);
  console.log(JSON.stringify(prepareOfflineGscOrganicTrendDisplay(source),null,2));
}catch(error){
  console.error('SEO organic display refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
