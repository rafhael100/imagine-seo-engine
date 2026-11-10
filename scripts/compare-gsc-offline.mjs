import {readBoundedLocalText} from '../src/local-input.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const [previousFile,currentFile]=process.argv.slice(2);
async function input(path){
  return JSON.parse(await readBoundedLocalText(path));
}
if(!previousFile||!currentFile) {
  console.error('Usage: node scripts/compare-gsc-offline.mjs previous.json current.json');
  process.exitCode=2;
} else try {
  const result=compareGscPeriods(await input(previousFile),await input(currentFile));
  console.log(JSON.stringify(result,null,2));
} catch(error) {
  console.error('SEO trend comparison failed:',error.message);
  process.exitCode=1;
}
