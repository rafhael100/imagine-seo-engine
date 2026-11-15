/**
 * SEO-F106 — offline-only Imagine funnel UX preview. Input is a private JSON
 * object with comparisonInput:{previous:<original F104>,current:<original F104>}.
 * No network, tokens, customer data or source content written to output.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {prepareOfflineSeoFunnelPreview}
  from '../src/seo-funnel-preview.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/preview-seo-funnel-offline.mjs <private-comparison.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{
    maxBytes:512*1024
  }));
  console.log(JSON.stringify(prepareOfflineSeoFunnelPreview(input),null,2));
}catch(error){
  console.error('SEO funnel preview refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
