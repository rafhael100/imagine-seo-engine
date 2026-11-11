/**
 * SEO-F51 — strictly local GSC workflow review. Never contact Google.
 * The input must stay outside public repositories and CI when it contains
 * real customer exports; stdout contains only sanitized aggregates.
 */
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewOfflineGscReadiness} from '../src/gsc-offline-workflow.mjs';

const [inputFile,...extra]=process.argv.slice(2);
if(!inputFile||extra.length){
  console.error('Usage: node scripts/review-gsc-workflow-offline.mjs <authorized-local-fixture.json>');
  process.exitCode=2;
}else try{
  const parsed=parseSafeJson(await readBoundedLocalText(inputFile,{maxBytes:5*1024*1024}));
  console.log(JSON.stringify(reviewOfflineGscReadiness(parsed),null,2));
}catch(error){
  console.error('SEO GSC workflow refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
