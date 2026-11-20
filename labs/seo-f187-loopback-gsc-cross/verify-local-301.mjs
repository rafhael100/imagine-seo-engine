/**
 * F187: E2E read-only migration rehearsal using ACTUAL 127.0.0.1 HEAD
 * responses, F138 capture, F186 GSC proposal + HTTP evidence crosscheck,
 * and the audited local Astro build. NEVER public DNS or deployment.
 *
 * All staging URLs are fixed laboratory examples; only the local path of the
 * already-built static directory is a caller input. Returns counts, not URLs.
 */
import http from 'node:http';
import {auditStaticSite} from '../../src/audit-static.mjs';
import {captureLoopbackStaging301} from '../seo-f138-loopback/loopback-capture.mjs';
import {reviewGeneratedGsc301CrossEvidence}
 from '../../src/gsc-generated-301-cross-evidence.mjs';

const ORIGIN='https://imaginecomunicacao.com.br/';
const LEGACY='http://www.imaginecomunicacao.com.br/';
const MODES=new Set(['valid','temporary','wrong-location','second-hop','missing-final']);
const row={keys:[LEGACY],clicks:3,impressions:134,
 ctr:3/134,position:18.4};
const dataInput=()=>({
 sourceType:'operator_supplied_gsc_pages_unverified',
 property:'sc-domain:imaginecomunicacao.com.br',
 canonicalOrigin:ORIGIN,
 startDate:'2026-10-17',endDate:'2026-11-13',
 dataState:'final',dimensions:['page'],rows:[{...row,keys:[LEGACY]}],
 hasMore:false
});
function response(req,res,mode,seen){
 seen.push({method:req.method,host:req.headers.host,
   proto:req.headers['x-forwarded-proto']});
 if(req.method!=='HEAD'||
    req.headers['x-imagine-synthetic-staging-review']!=='f138'||
    req.url!=='/'){
  res.writeHead(403);res.end();return;
 }
 const legacy=req.headers.host==='www.imaginecomunicacao.com.br'&&
   req.headers['x-forwarded-proto']==='http';
 const canonical=req.headers.host==='imaginecomunicacao.com.br'&&
   req.headers['x-forwarded-proto']==='https';
 if(legacy){
  res.writeHead(mode==='temporary'?302:301,{
   Location:mode==='wrong-location'?'https://evil.invalid/':ORIGIN
  });res.end();return;
 }
 if(canonical){
  if(mode==='missing-final'){res.writeHead(404);res.end();return;}
  if(mode==='second-hop'){
   res.writeHead(302,{Location:'https://evil.invalid/'});
   res.end();return;
  }
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end();return;
 }
 res.writeHead(403);res.end();
}
async function serve(mode,seen){
 const server=http.createServer((req,res)=>response(req,res,mode,seen));
 try{
  await new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(0,'127.0.0.1',resolve);
  });
 }catch(e){server.close();throw e;}
 return {server,port:server.address().port};
}
const exact=(x,fields)=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&
 Reflect.ownKeys(x).length===fields.length&&
 fields.every(k=>{
  const d=Object.getOwnPropertyDescriptor(x,k);
  return d?.enumerable===true&&Object.hasOwn(d,'value');
 });
export async function reviewGscLoopbackAgainstRealAstro(input){
 if(!exact(input,['buildDirectory','mode'])||
   typeof input.buildDirectory!=='string'||input.buildDirectory.length<1||
   input.buildDirectory.length>2048||!MODES.has(input.mode)||
   process.env.SEO_F138_LOOPBACK_STAGING!=='YES_I_CONTROL_THIS_LOOPBACK'||
   !['staging','testing'].includes(process.env.APP_ENV))
  throw Error('SEO F187: explicit isolated laboratory context required');
 const audited=await auditStaticSite(input.buildDirectory,{
  siteUrl:ORIGIN,strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
 });
 if(audited.summary.pages<1||audited.summary.errors>0||
    !audited.routes.includes('/'))
  throw Error('SEO F187: actual compiled public homepage audit required');
 const migrationInput={
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'imaginecomunicacao.com.br',
  canonicalOrigin:ORIGIN,legacyUrls:[LEGACY],
  targetRoutes:[...audited.routes],
  candidates:[{fromUrl:LEGACY,toPath:'/',status:301}]
 };
 const seen=[];
 const {server,port}=await serve(input.mode,seen);
 let result,headReview;
 try{
  const evidence=await captureLoopbackStaging301({
   migrationInput,stagingPort:port,timeoutMs:2000
  });
  headReview=evidence.review;
  result=await reviewGeneratedGsc301CrossEvidence({
   gscPageInput:dataInput(),
   targetRoutes:[...audited.routes],
   httpCapture:evidence.capture,
   buildDirectory:input.buildDirectory
  });
 }finally{
  await new Promise(resolve=>server.close(resolve));
 }
 if(seen.length!==2||seen.some(x=>x.method!=='HEAD'||![
   'www.imaginecomunicacao.com.br','imaginecomunicacao.com.br'
 ].includes(x.host))||
    seen[0].proto!=='http'||seen[1].proto!=='https')
  throw Error('SEO F187: unexpected loopback request sequence');
 // Fully sanitized; there is NO private receipt or URL in this output.
 return Object.freeze({
  contractVersion:'seo-f187-real-loopback-gsc-http-astro-crosscheck-v1',
  actualLocalHttpHeadRequests:seen.length,
  actualCompiledHtmlPages:audited.summary.pages,
  proposed301s:result.proposedRedirects,
  checkedHttpReceipts:result.checkedHttpReceipts,
  originalHttpCaptureStatus:headReview.reviewStatus,
  independentCrossEvidenceStatus:result.reviewStatus,
  providerGscAuthenticated:false,tenantGrantAuthenticated:false,
  publicNetworkCalled:false,
  stagingTlsVerified:false,productionOriginVerified:false,
  editorialEquivalenceApproved:false,
  publicationAuthorized:false,redirectDeploymentAuthorized:false,
  indexingAuthorized:false,
  releaseStatus:'HOLD_REAL_VPS_TLS_GSC_TENANT_AND_HUMAN_APPROVAL'
 });
}
