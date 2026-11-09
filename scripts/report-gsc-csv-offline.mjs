import {readFile,stat} from 'node:fs/promises';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {analyzeQueryExport} from '../src/opportunities.mjs';

const [file,startDate,endDate]=process.argv.slice(2);
if(!file||!startDate||!endDate){
  console.error('Usage: node scripts/report-gsc-csv-offline.mjs export.csv 2026-11-01 2026-11-08');
  process.exitCode=2;
}else try{
  const meta=await stat(file);
  if(!meta.isFile()||meta.size>10*1024*1024)throw Error('GSC CSV: local file <=10 MiB required');
  const csv=await readFile(file,'utf8');
  const report=importGscQueriesCsv(csv,{startDate,endDate});
  // Somente estatísticas agregadas; não imprimir consultas brutas.
  console.log(JSON.stringify(analyzeQueryExport(report),null,2));
}catch(error){console.error('GSC CSV offline import failed:',error.message);process.exitCode=1;}
