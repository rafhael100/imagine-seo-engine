import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';

const [file,startDate,endDate,...extra]=process.argv.slice(2);
if(!file||!startDate||!endDate||extra.length){
  console.error('Usage: node scripts/report-gsc-csv-offline.mjs export.csv 2026-11-01 2026-11-08');
  process.exitCode=2;
}else try{
  const csv=await readBoundedLocalText(file);
  const report=importGscQueriesCsv(csv,{startDate,endDate});
  // Somente estatísticas agregadas; não imprimir consultas brutas.
  console.log(JSON.stringify(analyzeQueryExport(report),null,2));
}catch(error){console.error('GSC CSV offline import failed:',safeCliDiagnostic(error));process.exitCode=1;}
