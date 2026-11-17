/**
 * SEO F142 — verify ACTUAL GET bodies served by an isolated loopback proxy
 * against the approved local static HTML files, not just a proxy-supplied
 * SHA header. No public DNS, redirects, cookies, auth or publication.
 *
 * This is an explicit opt-in NETWORK LAB. The F77 offline src/scripts policy
 * remains unmodified. Never serialize local paths, hosts or response bodies.
 */
import http from 'node:http';
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,sep} from 'node:path';
import {reviewLegacyOriginAndLocaleRedirects} from
  '../../src/legacy-origin-locale-redirect-review.mjs';

const MAX_ROUTES=80,MAX_BODY=2*1024*1024,MAX_TOTAL=16*1024*1024;
const CODES=Object.freeze({
  status:'non_200_html_status',
  encoding:'unexpected_content_encoding',
  type:'non_html_content_type',
  size:'served_html_size_mismatch',
  digest:'served_html_digest_mismatch'
});
function exact(obj,fields){
  if(!obj||typeof obj!=='object'||Array.isArray(obj)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(obj)))return false;
  const keys=Reflect.ownKeys(obj);
  return keys.length===fields.length&&keys.every(k=>{
    const d=Object.getOwnPropertyDescriptor(obj,k);
    return typeof k==='string'&&fields.includes(k)&&d?.enumerable===true&&
      Object.hasOwn(d,'value');
  });
}
function unsafe(){throw Error('SEO F142: unsafe bounded compiled HTML');}
function filenameForRoute(root,route){
  // F127 has already checked path encoding, dot segments, URI normalization
  // and source equivalence. No percent escapes or query strings are allowed.
  if(typeof route!=='string'||!route.startsWith('/')||
     route.startsWith('//')||/[?#%\\\u0000-\u001f\u007f]/.test(route)||
     route.split('/').some(s=>s==='.'||s==='..'||s==='.git'))
    unsafe();
  const p=route==='/'?['index.html']:
    route.endsWith('.html')?
      [...route.slice(1).split('/')]:
      [...route.slice(1).split('/').filter(Boolean),'index.html'];
  if(p.some(s=>!s||s.length>255))unsafe();
  const relative=p.join('/');
  const absolute=resolve(root,...p);
  if(!absolute.startsWith(root+sep))unsafe();
  return {absolute,parents:p.slice(0,-1),relative};
}
async function readLocalHtml(root,route){
  const location=filenameForRoute(root,route);
  let current=root;
  for(const segment of location.parents){
    current=join(current,segment);
    const st=await lstat(current);
    if(!st.isDirectory()||st.isSymbolicLink())unsafe();
  }
  const st=await lstat(location.absolute);
  if(!st.isFile()||st.isSymbolicLink()||st.size>MAX_BODY||st.size<1)unsafe();
  const fd=await open(location.absolute,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
    const before=await fd.stat();
    if(!before.isFile()||before.size!==st.size||
       before.ino!==st.ino||before.dev!==st.dev)unsafe();
    const bytes=await fd.readFile();
    const after=await fd.stat();
    if(bytes.length!==before.size||bytes.length>MAX_BODY||
       after.size!==before.size||after.ino!==before.ino||
       after.mtimeMs!==before.mtimeMs)unsafe();
    return {bytes,sha256:createHash('sha256').update(bytes).digest('hex')};
  }finally{await fd.close();}
}
function getLoopbackHtml(route,hostname,port,timeoutMs){
  return new Promise((resolvePromise,rejectPromise)=>{
    let settled=false;
    const done=(err,value)=>{
      if(settled)return;
      settled=true;
      if(err)rejectPromise(Error('SEO F142: local HTML GET failed'));
      else resolvePromise(value);
    };
    const req=http.request({
      hostname:'127.0.0.1',family:4,port,method:'GET',path:route,
      // F203: exact bytes received too late must not validate the served build.
      agent:false,maxHeaderSize:8192,signal:AbortSignal.timeout(timeoutMs),
      headers:{
        Host:hostname,
        'X-Forwarded-Proto':'https',
        'X-Imagine-Synthetic-Staging-Review':'f142',
        'Accept-Encoding':'identity',
        Accept:'text/html'
      }
    },res=>{
      const contentTypes=res.headersDistinct['content-type']??[];
      const chunks=[];
      let size=0;
      res.on('data',chunk=>{
        size+=chunk.length;
        if(size>MAX_BODY){
          res.destroy();
          done(Error('SEO F142: served HTML exceeds bound'));
        }else chunks.push(chunk);
      });
      res.on('end',()=>{
        done(null,{
          status:res.statusCode,
          contentEncoding:res.headers['content-encoding'],
          // A correct first MIME type cannot hide a second conflicting field.
          contentType:contentTypes.length===1?contentTypes[0]:undefined,
          body:Buffer.concat(chunks,size)
        });
      });
      res.on('error',()=>done(Error('SEO F142: local HTML stream failed')));
    });
    req.on('error',()=>done(Error('SEO F142: local HTTP failed')));
    req.setTimeout(timeoutMs,()=>req.destroy(Error('SEO F142: local timeout')));
    req.end();
  });
}
export async function reviewLoopbackServedHtmlParity(input){
  if(!exact(input,['migrationInput','buildDirectory','stagingPort','timeoutMs'])||
     process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
     !['staging','testing'].includes(process.env.APP_ENV)||
     !Number.isSafeInteger(input.stagingPort)||
     input.stagingPort<1024||input.stagingPort>65535||
     !Number.isSafeInteger(input.timeoutMs)||
     input.timeoutMs<100||input.timeoutMs>5000||
     typeof input.buildDirectory!=='string'||input.buildDirectory.length>2048)
    throw Error('SEO F142: explicitly authorized loopback staging required');

  const review=reviewLegacyOriginAndLocaleRedirects(input.migrationInput);
  if(review.reviewStatus==='blocked')unsafe();
  const routes=input.migrationInput.targetRoutes;
  if(routes.length<1||routes.length>MAX_ROUTES)unsafe();
  const root=resolve(input.buildDirectory);
  const rstat=await lstat(root);
  if(!rstat.isDirectory()||rstat.isSymbolicLink())unsafe();

  const hostname=new URL(input.migrationInput.canonicalOrigin).hostname;
  const local=[];
  let totalBytes=0;
  // Verify ALL local target pages before any HTTP connection.
  for(const route of routes){
    const file=await readLocalHtml(root,route);
    totalBytes+=file.bytes.length;
    if(totalBytes>MAX_TOTAL)unsafe();
    local.push(file);
  }
  let tested=0,matching=0,wrongStatus=0,wrongEncoding=0;
  let wrongContentType=0,wrongSize=0,wrongHash=0;
  const failureIndices=[];
  for(let i=0;i<routes.length;i++){
    const live=await getLoopbackHtml(routes[i],hostname,
      input.stagingPort,input.timeoutMs);
    tested++;
    let code=null;
    if(live.status!==200){wrongStatus++;code=CODES.status;}
    else if(live.contentEncoding!==undefined){
      wrongEncoding++;code=CODES.encoding;
    }else if(typeof live.contentType!=='string'||
      !/^text\/html(?:\s*;|$)/i.test(live.contentType)){
      wrongContentType++;code=CODES.type;
    }else if(live.body.length!==local[i].bytes.length){
      wrongSize++;code=CODES.size;
    }else if(createHash('sha256').update(live.body).digest('hex')!==
      local[i].sha256){
      wrongHash++;code=CODES.digest;
    }else matching++;
    if(code!==null&&failureIndices.length<80)
      failureIndices.push({targetRouteIndex:i,code});
  }
  const blocked=matching!==routes.length;
  return {
    contractVersion:'seo-f142-loopback-real-html-body-parity-v1',
    reviewStatus:blocked?'blocked':'human_independent_served_html_review_required',
    summary:{
      targetsDeclared:routes.length,localHtmlFilesRead:local.length,
      localHtmlBytesRead:totalBytes,loopbackGetRequests:tested,
      identicalHtmlResponses:matching,wrongStatus,
      unexpectedEncoding:wrongEncoding,unexpectedContentType:wrongContentType,
      wrongContentLength:wrongSize,wrongHtmlDigest:wrongHash
    },
    failureIndices,
    networkPerformed:true,
    loopbackOnlyConnectionUsed:true,
    exactHtmlBytesCompared:true,
    trustedProxyIdentityVerified:false,
    tlsAndSniVerified:false,
    realGscTenantVerified:false,
    productionHtmlVerified:false,
    publicationAuthorized:false,
    releaseStatus:'HOLD_STAGING_IDENTITY_EDITORIAL_AND_INDEPENDENT_APPROVAL'
  };
}
