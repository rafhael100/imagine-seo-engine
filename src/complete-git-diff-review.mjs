/**
 * SEO F188 — parse the COMPLETE NUL-terminated Git name-status diff.
 *
 * F160 only used --name-only --diff-filter=ACMRT, which omitted DELETIONS
 * and the OLD pathname of a rename. Both can hide removal of auth, secrets,
 * workflow or infrastructure controls from an independent release review.
 */
import {categorizeReleaseDiff} from './release-diff-risk.mjs';
const STATUSES=new Set(['A','D','M','T']);
const MAX_BYTES=4*1024*1024,MAX_RECORDS=50000;
export function inspectCompleteGitDiffStatuses(raw){
 if(!Buffer.isBuffer(raw)||raw.length<4||raw.length>MAX_BYTES||
    raw[raw.length-1]!==0)
  throw Error('SEO F188: bounded NUL-delimited Git status required');
 let source;
 try{source=new TextDecoder('utf-8',{fatal:true}).decode(raw);}
 catch{throw Error('SEO F188: invalid UTF8 Git status');}
 const tokens=source.split('\0');
 if(tokens.pop()!==''||tokens.some(x=>x.length===0))
  throw Error('SEO F188: malformed NUL status fields');
 let i=0,records=0;
 const paths=new Set();
 const statusCounts={added:0,deleted:0,modified:0,renamed:0,copied:0,typeChanged:0};
 while(i<tokens.length){
  if(++records>MAX_RECORDS)
   throw Error('SEO F188: too many cumulative changes');
  const status=tokens[i++];
  const rename=/^R(?:100|[1-9]?[0-9])$/.test(status);
  const copy=/^C(?:100|[1-9]?[0-9])$/.test(status);
  if(!STATUSES.has(status)&&!rename&&!copy)
   throw Error('SEO F188: unrecognized Git status');
  const first=tokens[i++];
  if(typeof first!=='string'||first.length<1)
   throw Error('SEO F188: missing Git source path');
  paths.add(first);
  if(rename||copy){
   const second=tokens[i++];
   if(typeof second!=='string'||!second||second===first)
    throw Error('SEO F188: invalid rename or copy pair');
   paths.add(second);
   if(rename)statusCounts.renamed++;
   else statusCounts.copied++;
  }else{
   if(status==='D')statusCounts.deleted++;
   if(status==='A')statusCounts.added++;
   if(status==='M')statusCounts.modified++;
   if(status==='T')statusCounts.typeChanged++;
  }
 }
 // Categorization performs independent path validation: no traversal, control
 // bytes, duplicate metrics, absolute paths or overlong path names.
 const risk=categorizeReleaseDiff([...paths]);
 return Object.freeze({
  contractVersion:'seo-f188-complete-commit-git-diff-risk-v1',
  diffRecords:records,
  reviewedPathEndpoints:risk.changedPaths,
  changedPaths:risk.changedPaths,
  categories:risk.categories,
  criticalReviewPaths:risk.criticalReviewPaths,
  statusCounts:Object.freeze(statusCounts),
  riskGroups:risk.categories,
  criticalReviewPathEndpoints:risk.criticalReviewPaths,
  deletedFilesIncluded:true,
  oldAndNewRenamePathsIncluded:true,
  manuallyReviewDeletedSecurityPaths:statusCounts.deleted>0,
  manuallyReviewRenameProvenance:statusCounts.renamed>0,
  independentReviewerRequired:true,
  personalDataContentScanned:false,
  entireHistoryIndependentlyAudited:false,
  mergeAuthorized:false,
  deployAuthorized:false,
  publicationAuthorized:false,
  networkPerformed:false,
  releaseStatus:'HOLD_CUMULATIVE_REVIEW_SECURITY_AND_INDEPENDENT_APPROVAL'
 });
}
