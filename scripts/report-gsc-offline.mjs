import {safeCliDiagnostic,parseSafeJson} from '../src/cli-diagnostics.mjs';
import {readBoundedLocalText} from '../src/local-input.mjs';
import { analyzeQueryExport } from '../src/opportunities.mjs';

const path=process.argv[2];
if(!path) {console.error('Usage: node scripts/report-gsc-offline.mjs <authorized-export.json>');process.exitCode=2;}
else try {
  const parsed=parseSafeJson(await readBoundedLocalText(path));
  console.log(JSON.stringify(analyzeQueryExport(parsed),null,2));
}catch(error){console.error('SEO report failed:',safeCliDiagnostic(error));process.exitCode=1;}
