/**
 * SEO F201: byte-identical served robots.txt and sitemap.xml from actual
 * private Nginx loopback. Never connect to Google/DNS/remote staging.
 * Do not return local paths, headers, hosts, URLs, or SEO metadata contents.
 */
import http from 'node:http';
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,resolve} from 'node:path';

const FILES=Object.freeze([
 {path:'/robots.txt',file:'robots.txt',type:/^text\/plain(?:\s*;|$)/i,
  error:'robots_metadata_mismatch'},
 {path:'/sitemap.xml',file:'sitemap.xml',
  type:/^(?:application|text)\/xml(?:\s*;|$)/i,
  error:'sitemap_metadata_mismatch'}
]);
function exact(x,keys){
 return x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(x))&&
  Reflect.ownKeys(x).length===keys.length&&
  keys.every(k=>{
   const d=Object.getOwnPropertyDescriptor(x,k);
   return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function unsafe(){throw Error('SEO F201: unsafe local metadata or loopback input');}
async function localMetadata(root,file){
 const p=join(root,file);
 const before=await lstat(p);
 if(!before.isFile()||before.isSymbolicLink()||
    before.size<12||before.size>2*1024*1024)unsafe();
 const fd=await open(p,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const st=await fd.stat();
  if(!st.isFile()||st.ino!==before.ino||st.dev!==before.dev||
     st.size!==before.size)unsafe();
  const bytes=await fd.readFile();
  if(bytes.length!==st.size||bytes.length>2*1024*1024)unsafe();
  return bytes;
 }finally{await fd.close();}
}
async function servedMetadata(path,port,timeout){
 return await new Promise((resolvePromise,rejectPromise)=>{
  let finished=false,req;
  const settle=(error,result)=>{
   if(finished)return;
   finished=true;
   if(error)rejectPromise(Error('SEO F201: isolated HTTP GET refused'));
   else resolvePromise(result);
  };
  req=http.request({
   hostname:'127.0.0.1',family:4,port,method:'GET',path,
   // F202: a slow byte trickle must not extend this GET indefinitely.
   // Node's idle socket timeout below alone cannot enforce total duration.
   agent:false,maxHeaderSize:8192,signal:AbortSignal.timeout(timeout),
   headers:{
    Host:'imaginecomunicacao.com.br','X-Forwarded-Proto':'https',
    'X-Imagine-Synthetic-Staging-Review':'f201',
    'Accept-Encoding':'identity'
   }
  },res=>{
   const chunks=[];let received=0;
   res.on('data',chunk=>{
    received+=chunk.length;
    if(received>2*1024*1024){
     res.destroy();
     settle(Error('SEO F201: response too large'));
    }else chunks.push(chunk);
   });
   res.on('end',()=>settle(null,{
    status:res.statusCode,
    type:res.headers['content-type'],
    encoding:res.headers['content-encoding'],
    redirect:res.headers.location,
    data:Buffer.concat(chunks,received)
   }));
   res.on('error',()=>settle(Error('SEO F201: stream error')));
  });
  req.on('error',()=>settle(Error('SEO F201: network error')));
  req.setTimeout(timeout,()=>req.destroy(Error('SEO F201: timeout')));
  req.end();
 });
}
export async function reviewNginxLoopbackSeoMetadata(input){
 if(!exact(input,['buildDirectory','stagingPort','timeoutMs'])||
    process.env.APP_ENV!=='testing'||
    process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
    typeof input.buildDirectory!=='string'||input.buildDirectory.length<2||
    input.buildDirectory.length>2048||
    !Number.isSafeInteger(input.stagingPort)||input.stagingPort<1024||
    input.stagingPort>65535||
    !Number.isSafeInteger(input.timeoutMs)||input.timeoutMs<100||
    input.timeoutMs>5000)
  unsafe();
 const root=resolve(input.buildDirectory),meta=await lstat(root);
 if(!meta.isDirectory()||meta.isSymbolicLink())unsafe();
 // Read BOTH independent local files before making ANY HTTP request.
 const expected=await Promise.all(FILES.map(f=>localMetadata(root,f.file)));
 let checked=0,matching=0;
 const mismatches=[];
 for(let i=0;i<FILES.length;i++){
  const file=FILES[i];
  const res=await servedMetadata(file.path,input.stagingPort,input.timeoutMs);
  checked++;
  const valid=res.status===200&&
   typeof res.type==='string'&&file.type.test(res.type)&&
   res.encoding===undefined&&res.redirect===undefined&&
   res.data.equals(expected[i]);
  if(valid)matching++;
  else mismatches.push(file.error);
 }
 return Object.freeze({
  contractVersion:'seo-f201-real-nginx-served-robots-sitemap-v1',
  reviewStatus:mismatches.length?'blocked':
   'human_live_static_metadata_review_required',
  checkedLocalMetadataFiles:expected.length,
  actualLoopbackHttpGetRequests:checked,
  byteIdenticalServedMetadataFiles:matching,
  blockedComponents:Object.freeze(mismatches),
  localOnlyHttp:true,
  actualGooglebotFetchVerified:false,
  realGscTenantVerified:false,
  remoteTlsVerified:false,
  publicRobotsIndexingAuthorized:false,
  deploymentAuthorized:false,
  publicationAuthorized:false,
  releaseStatus:'HOLD_REAL_STAGING_GOOGLEBOT_INDEXING_AND_HUMAN_REVIEW'
 });
}
