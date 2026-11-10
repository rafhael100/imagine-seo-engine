import {readBoundedLocalText} from '../src/local-input.mjs';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';

const [auditFile,trendFile,...rest]=process.argv.slice(2);
if(!auditFile||rest.length){
  console.error('Usage: node scripts/report-seo-brief-offline.mjs audit.json [trend.json]');
  process.exitCode=2;
}else try{
  const audit=JSON.parse(await readBoundedLocalText(auditFile,{maxBytes:5*1024*1024}));
  const trend=trendFile?JSON.parse(await readBoundedLocalText(trendFile,{maxBytes:5*1024*1024})):null;
  console.log(JSON.stringify(buildOfflineSeoBrief({audit,trend}),null,2));
}catch(error){
  console.error('SEO brief offline failed:',error.message);
  process.exitCode=1;
}
