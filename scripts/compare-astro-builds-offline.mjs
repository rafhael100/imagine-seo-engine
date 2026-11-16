/**
 * SEO F166 — compare two real LOCAL Astro dist folders (no HTTP requests).
 * Scanner performs strict public head and multilingual hreflang validation
 * on BOTH builds before the private raw audits enter the F162 comparator.
 * Only the sanitized aggregate report is printed.
 */
import {auditStaticSite} from '../src/audit-static.mjs';
import {compareOfflineTechnicalAudits} from '../src/technical-audit-regression.mjs';
import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {realpath,stat} from 'node:fs/promises';

const args=process.argv.slice(2);
if(args.length!==4 && (args.length!==5||args[4]!=='--require-clean-current')){
 console.error('Usage: node scripts/compare-astro-builds-offline.mjs <before-dist> <after-dist> <before-40hex-sha> <after-40hex-sha> [--require-clean-current]');
 process.exitCode=2;
}else try{
 const [beforeDir,afterDir,previousRevision,currentRevision,option]=args;
 const requireCleanCurrent=option==='--require-clean-current';
 if(!/^[0-9a-f]{40}$/.test(previousRevision)||
    !/^[0-9a-f]{40}$/.test(currentRevision)||
    previousRevision===currentRevision)
   throw Error('SEO technical regression: distinct local source revisions required');
 // Fail closed when two different spellings point to the same compiled
 // artifact (e.g. './dist' versus 'x/../dist'). A false no-change report is
 // not useful, even though it would remain non-publishable.
 const [realBefore,realAfter]=await Promise.all([realpath(beforeDir),realpath(afterDir)]);
 const [beforeInfo,afterInfo]=await Promise.all([stat(realBefore),stat(realAfter)]);
 if(realBefore===realAfter||
    (beforeInfo.dev===afterInfo.dev&&beforeInfo.ino===afterInfo.ino))
   throw Error('SEO audit gate: two distinct local build directories required');
 const settings={
  strictPublicHead:true,
  allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
  checkHreflang:true
 };
 // Sequential scans preserve resource budget and ensure neither side is
 // bypassed. Any scan error is sanitized; do not print raw private file paths.
 const previous=await auditStaticSite(beforeDir,settings);
 const current=await auditStaticSite(afterDir,settings);
 const report=compareOfflineTechnicalAudits({
  previous,current,previousRevision,currentRevision
 });
 console.log(JSON.stringify(report,null,2));
 // Distinguish absence of NEW findings from an inherited broken build.
 // Release preflight must use --require-clean-current; even then it never
 // authorizes customer display, production or DNS changes.
 if(report.status!=='NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS'||
    (requireCleanCurrent&&report.currentBuildHasFindings))
   process.exitCode=1;
}catch(error){
 console.error('SEO compiled-build comparison failed:',safeCliDiagnostic(error));
 process.exitCode=1;
}
