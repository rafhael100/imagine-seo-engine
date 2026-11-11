import {safeCliDiagnostic,parseSafeJson} from '../src/cli-diagnostics.mjs';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const [previousFile,currentFile,...extra]=process.argv.slice(2);
async function input(path){
  return parseSafeJson(await readBoundedLocalText(path));
}
if(!previousFile||!currentFile||extra.length) {
  console.error('Usage: node scripts/compare-gsc-offline.mjs previous.json current.json');
  process.exitCode=2;
} else try {
  const result=compareGscPeriods(await input(previousFile),await input(currentFile));
  console.log(JSON.stringify(result,null,2));
} catch(error) {
  console.error('SEO trend comparison failed:',safeCliDiagnostic(error));
  process.exitCode=1;
}
