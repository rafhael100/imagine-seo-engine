import {readBoundedLocalText} from '../src/local-input.mjs';
import {compareStaticAuditReports} from '../src/audit-regression.mjs';
const [before,after]=process.argv.slice(2);
async function safeJson(path){
  return JSON.parse(await readBoundedLocalText(path,{maxBytes:5*1024*1024}));
}
if(!before||!after){
  console.error('Usage: node scripts/compare-audit-offline.mjs previous.json current.json');
  process.exitCode=2;
}else try{
  const result=compareStaticAuditReports(await safeJson(before),await safeJson(after));
  console.log(JSON.stringify(result,null,2));
  if(!result.passed)process.exitCode=1;
}catch(error){
  console.error('SEO audit regression comparison failed:',error.message);
  process.exitCode=2;
}
