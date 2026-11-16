/**
 * SEO F166 — compare two real LOCAL Astro dist folders (no HTTP requests).
 * Scanner performs strict public head and multilingual hreflang validation
 * on BOTH builds before the private raw audits enter the F162 comparator.
 * Only the sanitized aggregate report is printed.
 */
import {auditStaticSite} from '../src/audit-static.mjs';
import {compareOfflineTechnicalAudits} from '../src/technical-audit-regression.mjs';
import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';

const args=process.argv.slice(2);
if(args.length!==4){
 console.error('Usage: node scripts/compare-astro-builds-offline.mjs <before-dist> <after-dist> <before-40hex-sha> <after-40hex-sha>');
 process.exitCode=2;
}else try{
 const [beforeDir,afterDir,previousRevision,currentRevision]=args;
 if(!/^[0-9a-f]{40}$/.test(previousRevision)||
    !/^[0-9a-f]{40}$/.test(currentRevision)||
    previousRevision===currentRevision)
   throw Error('SEO technical regression: distinct local source revisions required');
 if(beforeDir===afterDir)
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
 if(report.status!=='NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS')
   process.exitCode=1;
}catch(error){
 console.error('SEO compiled-build comparison failed:',safeCliDiagnostic(error));
 process.exitCode=1;
}
