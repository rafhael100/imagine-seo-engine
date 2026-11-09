import {readFile,stat} from 'node:fs/promises';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const [previousFile,currentFile]=process.argv.slice(2);
async function input(path){
  const file=await stat(path);
  if(!file.isFile()||file.size>10*1024*1024)throw new Error('Input must be a local JSON file <= 10 MiB');
  return JSON.parse(await readFile(path,'utf8'));
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
