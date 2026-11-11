/**
 * SEO-F75 — local-only Portal query/page review packet. Parses a private,
 * operator-owned JSON input and emits only a bounded, unverified aggregate.
 * This does NOT access Google APIs, authorize a tenant or publish reports.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {prepareOfflinePortalQueryPageReview}
  from '../src/portal-query-page-review.mjs';

const [path,...extra]=process.argv.slice(2);
if(!path||extra.length){
  console.error('Usage: node scripts/prepare-portal-query-page-review-offline.mjs <private-evidence.json>');
  process.exitCode=2;
}else try{
  const data=parseSafeJson(await readBoundedLocalText(path,{maxBytes:10*1024*1024}));
  const envelope=prepareOfflinePortalQueryPageReview(data);
  console.log(JSON.stringify(envelope,null,2));
}catch(error){
  console.error('SEO Portal query/page review refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
