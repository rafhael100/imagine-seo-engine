import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {reviewStaticRouteMigration} from '../src/redirect-review.mjs';

const [oldFile,newFile,redirectsFile,...unexpected]=process.argv.slice(2);
if(!oldFile||!newFile||!redirectsFile||unexpected.length){
  console.error('Usage: node scripts/review-route-migration-offline.mjs before.json after.json candidate-redirects.json');
  process.exitCode=2;
}else try{
  const parse=async path=>parseSafeJson(await readBoundedLocalText(path,{maxBytes:5*1024*1024}));
  const result=reviewStaticRouteMigration({
    before:await parse(oldFile),after:await parse(newFile),candidates:await parse(redirectsFile)
  });
  console.log(JSON.stringify(result,null,2));
  // Loss of even one route ALWAYS needs a manual gate after this local review.
  if(result.humanReviewRequired)process.exitCode=1;
}catch(error){
  console.error('SEO redirect review failed:',safeCliDiagnostic(error));
  process.exitCode=2;
}
