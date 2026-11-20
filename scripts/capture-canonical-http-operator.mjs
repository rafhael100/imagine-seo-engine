#!/usr/bin/env node
/**
 * SEO F218: operator-only canonical GET evidence collector.
 * Fixed HTTPS origin, no credentials, no redirects, output 0600 outside Git.
 * The only stdout is a count; no page HTML, URL, cookie or token is logged.
 */
import {constants,closeSync,existsSync,lstatSync,openSync,
 realpathSync,statSync,writeSync,unlinkSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson} from '../src/cli-diagnostics.mjs';
import {captureCanonicalPublicHttpEvidence}
 from '../src/canonical-public-http-capture.mjs';

const checkoutPath=fileURLToPath(new URL('../',import.meta.url));
const fail=()=>{throw Error('SEO F218: private capture unavailable');};
function externalPrivateFile(path){
 if(typeof path!=='string'||!isAbsolute(path)||path.includes('\0')||
    !path.endsWith('.json')||typeof process.getuid!=='function')fail();
 const parent=realpathSync.native(dirname(path));
 const physical=join(parent,basename(path));
 const checkout=realpathSync.native(checkoutPath);
 if(physical===checkout||physical.startsWith(checkout+sep))fail();
 const dir=statSync(parent);
 if(!dir.isDirectory()||dir.uid!==process.getuid()||
    (dir.mode&0o077)!==0)fail();
 return physical;
}
let created=null;
try{
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--pages'||args[2]!=='--output'||
    process.env.IMAGINE_SEO_HTTP_CAPTURE!=='1'||
    process.env.GITHUB_ACTIONS==='true')fail();
 const inputPath=externalPrivateFile(args[1]);
 const outputPath=externalPrivateFile(args[3]);
 if(inputPath===outputPath||existsSync(outputPath))fail();
 const file=lstatSync(inputPath);
 if(!file.isFile()||file.isSymbolicLink()||file.uid!==process.getuid()||
    (file.mode&0o777)!==0o600||file.nlink!==1)fail();
 const timeoutValue=process.env.IMAGINE_SEO_HTTP_TIMEOUT_MS??'7000';
 const timeoutMs=Number(timeoutValue);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>10000||
    String(timeoutMs)!==timeoutValue)fail();
 const data=parseSafeJson(await readBoundedLocalText(inputPath,{maxBytes:512*1024}));
 const result=await captureCanonicalPublicHttpEvidence(data,{timeoutMs});
 const bytes=Buffer.from(JSON.stringify(result,null,2)+'\n');
 if(bytes.length>700*1024)fail();
 let descriptor;
 try{
  descriptor=openSync(outputPath,constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  created=outputPath;
  let offset=0;
  while(offset<bytes.length)
   offset+=writeSync(descriptor,bytes,offset,bytes.length-offset);
 }finally{
  if(descriptor!==undefined)closeSync(descriptor);
 }
 created=null;
 console.log('SEO F218: '+result.targetEvidence.observations.length+
  ' public canonical target statuses saved privately; REVIEW ONLY, NO RELEASE.');
}catch{
 if(created!==null)try{unlinkSync(created);}catch{/* avoid leaking paths */ }
 console.error('SEO F218: private canonical HTTP evidence unavailable (HOLD)');
 process.exitCode=2;
}
