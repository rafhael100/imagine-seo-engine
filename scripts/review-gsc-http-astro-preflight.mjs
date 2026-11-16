#!/usr/bin/env node
/**
 * F186 — private operator CLI: source GSC PAGE + independent HTTP HEAD
 * observations + compiled Astro dist -> sanitized HOLD-only result.
 *
 * Never emits raw URLs, a proposal manifest, request headers, file names,
 * customer data, or a deployable Nginx/Cloudflare configuration.
 * Input files must be private 0600 in private 0700 directories on Unix.
 * NO GOOGLE NETWORK, NO REDIRECT INSTALL, NO PAYMENT OR PRODUCTION CHANGE.
 */
import {open,lstat,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname} from 'node:path';
import {reviewOfflineGscPageOrigins} from '../src/gsc-page-origin-parity.mjs';
import {auditStaticSite} from '../src/audit-static.mjs';
import {reviewGeneratedGsc301CrossEvidence} from
 '../src/gsc-generated-301-cross-evidence.mjs';

const MAX_FILE=5*1024*1024;
async function readPrivateJson(path){
 if(typeof path!=='string'||!path||path.startsWith('-')||path.length>2048)
  throw Error('F186: private input required');
 const [file,parent]=await Promise.all([lstat(path),lstat(dirname(path))]);
 if(!file.isFile()||file.isSymbolicLink()||file.size<2||
    file.size>MAX_FILE||!parent.isDirectory()||parent.isSymbolicLink()||
    (process.platform!=='win32'&&
     ((file.mode&0o077)!==0||(parent.mode&0o077)!==0)))
  throw Error('F186: private 0600 file in 0700 directory required');
 const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const current=await fd.stat();
  if(!current.isFile()||current.size<2||current.size>MAX_FILE||
     current.ino!==file.ino||current.dev!==file.dev)
   throw Error('F186: private source changed');
  const raw=await fd.readFile();
  if(raw.length>MAX_FILE)throw Error('F186: bounded source required');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
 }finally{await fd.close();}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==3||args.some(x=>typeof x!=='string'||!x||x.startsWith('-')||
    x.length>2048))
  throw Error('F186: exact private GSC, HTTP and Astro build paths required');
 const [pagePath,httpPath,buildPath]=args;
 const [pageReal,httpReal]=await Promise.all([realpath(pagePath),realpath(httpPath)]);
 if(pageReal===httpReal)
  throw Error('F186: independent PAGE and HTTP evidence required');
 const [gscPageInput,httpCapture]=await Promise.all([
  readPrivateJson(pagePath),readPrivateJson(httpPath)
 ]);
 // F131 checks actual provider-shaped PAGE rows and private URL variants
 // before any local build or HTTP evidence is accessed. These incomplete
 // sources must not generate even a private proposed redirect manifest.
 const source=reviewOfflineGscPageOrigins(gscPageInput);
 if(gscPageInput.hasMore||source.summary.redactedRows>0){
  process.stdout.write(JSON.stringify({
   contractVersion:'seo-f186-operator-gsc-http-astro-preflight-v1',
   reviewStatus:gscPageInput.hasMore?'HOLD_INCOMPLETE_GSC_PAGINATION':
    'HOLD_PRIVATE_GSC_URL_VARIANTS',
   proposalGenerated:false,actualStaticHtmlAudited:false,
   authenticatedGoogleDataVerified:false,tenantGrantVerified:false,
   stagingHttpAuthenticated:false,publicationAuthorized:false,
   redirectDeploymentAuthorized:false,networkPerformed:false,
   releaseStatus:'HOLD_GSC_PAGINATION_OR_PRIVATE_URLS'
  })+'\n');
  process.exitCode=1;
  return;
 }
 const buildInfo=await lstat(buildPath);
 if(!buildInfo.isDirectory()||buildInfo.isSymbolicLink())
  throw Error('F186: local static Astro directory required');
 const buildDir=await realpath(buildPath);
 const audit=await auditStaticSite(buildDir,{
  siteUrl:gscPageInput.canonicalOrigin,
  strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
 });
 if(audit.summary.pages<1||audit.summary.errors>0||
    audit.routes.length!==audit.summary.pages)
  throw Error('F186: compiled HTML failed static SEO audit');
 const reviewed=await reviewGeneratedGsc301CrossEvidence({
  gscPageInput,targetRoutes:audit.routes,
  httpCapture,buildDirectory:buildDir
 });
 process.stdout.write(JSON.stringify({
  ...reviewed,
  actualStaticHtmlAudited:true,
  auditedBuildPages:audit.summary.pages,
  outstandingStaticHtmlWarnings:audit.summary.warnings,
  privateManifestPersisted:false
 })+'\n');
 // Even a complete, internally consistent rehearsal is not a GO. It lacks
 // authenticated Google source, staging origin, editorial equivalence and
 // a human release owner. The status is ALWAYS nonzero.
 process.exitCode=1;
}
main().catch(()=>{
 // Node errors often include private paths/URLs. Never echo raw exceptions.
 process.stderr.write('SEO F186: private evidence or compiled Astro validation failed\n');
 process.exitCode=2;
});
