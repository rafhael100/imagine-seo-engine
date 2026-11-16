/**
 * F162 — compare explicit offline Astro audit JSONs.
 * This CLI neither crawls a site nor accesses Search Console/Google.
 * Examples: node scripts/compare-technical-audits-offline.mjs before.json after.json <before-sha> <after-sha>
 */
import {safeCliDiagnostic,parseSafeJson} from '../src/cli-diagnostics.mjs';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {compareOfflineTechnicalAudits} from '../src/technical-audit-regression.mjs';

const args=process.argv.slice(2);
if(args.length!==4){
 console.error('Usage: node scripts/compare-technical-audits-offline.mjs previous-audit.json current-audit.json previous-40hex-revision current-40hex-revision');
 process.exitCode=2;
}else try{
 const [previousPath,currentPath,previousRevision,currentRevision]=args;
 if(!/^[0-9a-f]{40}$/.test(previousRevision)||
    !/^[0-9a-f]{40}$/.test(currentRevision)||
    previousRevision===currentRevision)
   throw Error('Distinct local source revisions required');
 const previous=parseSafeJson(await readBoundedLocalText(previousPath));
 const current=parseSafeJson(await readBoundedLocalText(currentPath));
 const report=compareOfflineTechnicalAudits({previous,current,previousRevision,currentRevision});
 console.log(JSON.stringify(report,null,2));
 // A HOLD or an aggregate regression is never a passing readiness signal.
 if(report.status!=='NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS')
   process.exitCode=1;
}catch(error){
 console.error('SEO technical comparison failed:',safeCliDiagnostic(error));
 process.exitCode=1;
}
