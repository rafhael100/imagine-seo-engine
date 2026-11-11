/**
 * SEO-F60 — private local CLI for up to four paginated Search Analytics
 * query/page responses. Never uses a Google token or public network.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewOfflineGscQueryPagePagination} from '../src/gsc-query-page-pagination.mjs';

const [file,...rest]=process.argv.slice(2);
if(!file || rest.length){
  console.error('Usage: node scripts/review-gsc-query-page-pages-offline.mjs <private-ordered-pages.json>');
  process.exitCode=2;
}else try{
  const data=parseSafeJson(await readBoundedLocalText(file,{maxBytes:10*1024*1024}));
  if(!data||typeof data!=='object'||Array.isArray(data)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(data))||
    Reflect.ownKeys(data).length!==2||
    Reflect.ownKeys(data).some(k=>!['scope','pages'].includes(k)))
    throw Error('SEO GSC overlap pagination: exact offline input required');
  console.log(JSON.stringify(
    reviewOfflineGscQueryPagePagination(data.pages,data.scope),null,2
  ));
}catch(error){
  console.error('SEO GSC overlap pagination refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
