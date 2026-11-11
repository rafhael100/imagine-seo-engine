/**
 * SEO-F58 — private local CLI for sanitized query/page overlap review.
 * No data leaves the local process; never persist or display raw queries.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewOfflineGscQueryPageOverlap} from '../src/gsc-query-page-overlap.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/review-gsc-query-page-offline.mjs <private-query-page.json>');
  process.exitCode=2;
}else try{
  const payload=parseSafeJson(await readBoundedLocalText(file,{maxBytes:5*1024*1024}));
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(payload))||
    Reflect.ownKeys(payload).length!==2||
    !Object.hasOwn(payload,'scope')||!Object.hasOwn(payload,'response'))
    throw Error('SEO GSC overlap: unsupported input');
  const result=reviewOfflineGscQueryPageOverlap(payload.response,payload.scope);
  console.log(JSON.stringify(result,null,2));
}catch(error){
  console.error('SEO GSC overlap refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
