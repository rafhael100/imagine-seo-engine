import {readBoundedLocalText} from '../src/local-input.mjs';
import { analyzeQueryExport } from '../src/opportunities.mjs';

const path=process.argv[2];
if(!path) {console.error('Usage: node scripts/report-gsc-offline.mjs <authorized-export.json>');process.exitCode=2;}
else try {
  const parsed=JSON.parse(await readBoundedLocalText(path));
  console.log(JSON.stringify(analyzeQueryExport(parsed),null,2));
}catch(error){console.error('SEO report failed:',error.message);process.exitCode=1;}
