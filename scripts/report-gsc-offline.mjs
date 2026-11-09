import { readFile, stat } from 'node:fs/promises';
import { analyzeQueryExport } from '../src/opportunities.mjs';

const path=process.argv[2];
if(!path) {console.error('Usage: node scripts/report-gsc-offline.mjs <authorized-export.json>');process.exitCode=2;}
else try {
  const info=await stat(path);
  if(!info.isFile() || info.size>10*1024*1024) throw new Error('GSC: input must be a local JSON file <= 10 MiB');
  const parsed=JSON.parse(await readFile(path,'utf8'));
  console.log(JSON.stringify(analyzeQueryExport(parsed),null,2));
}catch(error){console.error('SEO report failed:',error.message);process.exitCode=1;}
