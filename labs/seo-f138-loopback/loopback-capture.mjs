/**
 * SEO F138 — capture actual HEAD responses from an EXCLUSIVE LOOPBACK
 * staging reverse proxy. The ONLY TCP peer is 127.0.0.1:<explicit port>.
 *
 * Logical HTTP/HTTPS legacy hosts are passed as Host and X-Forwarded-Proto
 * to an isolated operator-controlled proxy; NO TLS, public DNS, public
 * network, credential or production identity is verified by this module.
 *
 * Capture contains PRIVATE original URLs and MUST NEVER go into Git/CI logs.
 */
import http from 'node:http';
import {reviewLegacyOriginAndLocaleRedirects} from
  '../../src/legacy-origin-locale-redirect-review.mjs';
import {reviewOfflineLegacyHttp301Receipts} from
  '../../src/legacy-http301-receipt-review.mjs';

const MAX_REQUESTS=80,MAX_TIMEOUT_MS=5000;
function plainExact(value,fields){
  if(!value||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===fields.length&&keys.every(key=>{
    if(typeof key!=='string'||!fields.includes(key))return false;
    const d=Object.getOwnPropertyDescriptor(value,key);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function requestLoopback(url,port,timeoutMs){
  return new Promise((resolve,reject)=>{
    // The only HTTP destination is a literal IPv4 loopback address, never
    // url.hostname. No automatic redirects, DNS lookup, or external fetch.
    const req=http.request({
      hostname:'127.0.0.1',family:4,port,method:'HEAD',
      path:url.pathname,
      headers:{
        Host:url.hostname,
        'X-Forwarded-Proto':url.protocol.slice(0,-1),
        'X-Imagine-Synthetic-Staging-Review':'f138'
      },
      agent:false,maxHeaderSize:8192
    },response=>{
      const rawLocation=response.headers.location;
      response.resume();
      if(Array.isArray(rawLocation)){
        reject(Error('SEO F138: ambiguous Location header'));
        return;
      }
      resolve({
        status:Number.isInteger(response.statusCode)?response.statusCode:599,
        location:typeof rawLocation==='string'?rawLocation:''
      });
    });
    req.on('error',()=>reject(Error('SEO F138: local staging request failed')));
    req.setTimeout(timeoutMs,()=>req.destroy(
      Error('SEO F138: local staging timeout')
    ));
    req.end();
  });
}
export async function captureLoopbackStaging301(input){
  if(!plainExact(input,['migrationInput','stagingPort','timeoutMs'])||
     process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
     !['staging','testing'].includes(process.env.APP_ENV)||
     !Number.isSafeInteger(input.stagingPort)||
     input.stagingPort<1024||input.stagingPort>65535||
     !Number.isSafeInteger(input.timeoutMs)||
     input.timeoutMs<100||input.timeoutMs>MAX_TIMEOUT_MS)
    throw Error('SEO F138: isolated explicit loopback staging only');

  const status=reviewLegacyOriginAndLocaleRedirects(input.migrationInput);
  if(status.reviewStatus==='blocked')
    throw Error('SEO F138: invalid redirect manifest');
  const plan=input.migrationInput;
  if(plan.candidates.length<1||plan.candidates.length>MAX_REQUESTS)
    throw Error('SEO F138: bounded HTTP probe batch required');

  const captures=[];
  for(const item of plan.candidates){
    const source=new URL(item.fromUrl);
    const target=new URL(item.toPath,plan.canonicalOrigin);
    // The target host comes from the F127-validated canonicalOrigin, not
    // from any untrusted remote Location header.
    const first=await requestLoopback(source,input.stagingPort,input.timeoutMs);
    const final=await requestLoopback(target,input.stagingPort,input.timeoutMs);
    captures.push({
      fromUrl:item.fromUrl,
      status:first.status,
      location:first.location,
      finalUrl:target.href,
      finalStatus:final.status,
      redirectHops:first.status>=300&&first.status<400?
        (final.status>=300&&final.status<400?2:1):0
    });
  }
  const capture={
    sourceType:'operator_supplied_http_head_captures_unverified',
    observations:captures
  };
  const review=reviewOfflineLegacyHttp301Receipts({
    migrationInput:plan,capture
  });
  return {capture,review};
}
