/** F168: only private, local JSON editorial inventories; no remote sources. */
import {open,constants} from 'node:fs/promises';
import {reviewNationalCityTemplateInventory} from '../src/geo-national-template-review.mjs';
const limit=21*1024*1024;
async function main(){
 if(process.argv.length!==3||!process.argv[2]||process.argv[2].startsWith('-'))
  throw Error('F168: one private inventory path required');
 const handle=await open(process.argv[2],constants.O_RDONLY|constants.O_NOFOLLOW);
 let body;
 try{
  const info=await handle.stat();
  if(!info.isFile()||info.size<2||info.size>limit||
    (process.platform!=='win32'&&(info.mode&0o077)!==0))
   throw Error('F168: private regular 0600 file required');
  body=await handle.readFile();
 }finally{await handle.close();}
 if(body.length>limit)throw Error('F168: source too large');
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));
 const result=reviewNationalCityTemplateInventory(data);
 process.stdout.write(JSON.stringify(result)+'\n');
 if(result.duplicateMunicipalityServiceLocaleCount||
    result.identicalCitySubstitutionTemplateCount)process.exitCode=1;
}
main().catch(()=>{
 // Never echo path, city, content, source file or parsing exceptions.
 process.stderr.write('SEO F168: invalid private editorial inventory\n');
 process.exitCode=2;
});
