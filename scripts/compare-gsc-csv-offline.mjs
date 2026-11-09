import {readFile,stat} from 'node:fs/promises';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {compareGscPeriods} from '../src/organic-trends.mjs';

const [oldFile,oldStart,oldEnd,newFile,newStart,newEnd]=process.argv.slice(2);
if(!oldFile||!oldStart||!oldEnd||!newFile||!newStart||!newEnd){
  console.error('Usage: node scripts/compare-gsc-csv-offline.mjs before.csv 2026-10-01 2026-10-07 after.csv 2026-10-08 2026-10-14');
  process.exitCode=2;
}else try{
  async function importFile(file,startDate,endDate){
    const meta=await stat(file);
    if(!meta.isFile()||meta.size>10*1024*1024)throw Error('GSC CSV: local file <=10 MiB required');
    return importGscQueriesCsv(await readFile(file,'utf8'),{startDate,endDate});
  }
  const result=compareGscPeriods(
    await importFile(oldFile,oldStart,oldEnd),await importFile(newFile,newStart,newEnd));
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error('GSC CSV trend comparison failed:',error.message);process.exitCode=1;}
