/**
 * SEO-F53 — private local CLI for date-based Search Console summaries.
 * Does not access Google, persist data or print source payloads.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {analyzeOfflineGscDailySeries} from '../src/gsc-daily.mjs';

const [file,...rest]=process.argv.slice(2);
if(!file||rest.length){
  console.error('Usage: node scripts/report-gsc-daily-offline.mjs <private-date-series.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{maxBytes:1024*1024}));
  if(!input||typeof input!=='object'||Array.isArray(input)||
    Reflect.ownKeys(input).length!==2||
    !Object.hasOwn(input,'scope')||!Object.hasOwn(input,'response'))
    throw Error('SEO GSC daily: unsupported contract');
  const result=analyzeOfflineGscDailySeries(input.response,input.scope);
  console.log(JSON.stringify(result,null,2));
}catch(error){
  console.error('SEO GSC daily report refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
