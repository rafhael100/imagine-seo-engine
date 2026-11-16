/**
 * F107: local-only pre-editorial batch screening.
 * Private input file may contain draft body text and demand notes.
 * Output contains only ordinal indices, counts, review categories, and
 * release blocks — never content, city names or search terms.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewMunicipalSeoDraftBatch}
  from '../src/geo-batch-preflight.mjs';

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/review-geo-batch-offline.mjs <input.json>');
  process.exitCode=2;
}else try{
  const input=parseSafeJson(await readBoundedLocalText(file,{
    maxBytes:512*1024
  }));
  console.log(JSON.stringify(reviewMunicipalSeoDraftBatch(input),null,2));
}catch(error){
  console.error('SEO geo batch refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
