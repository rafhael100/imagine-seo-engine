/** F169 CLI — read-only two compiled-site route migration preflight. */
import {realpath,stat} from 'node:fs/promises';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {reviewTwoCompiledSiteMigration} from '../src/compiled-build-route-migration-review.mjs';
const [oldDir,newDir,oldSha,newSha,plan,...extra]=process.argv.slice(2);
if(!oldDir||!newDir||!oldSha||!newSha||extra.length){
 process.stderr.write('F169: expected before-dir after-dir before-SHA after-SHA [private-candidates-json]\n');
 process.exitCode=2;
}else try{
 if(!/^[a-f0-9]{40}$/.test(oldSha)||!/^[a-f0-9]{40}$/.test(newSha)||
   oldSha===newSha)throw Error('F169: distinct immutable revisions required');
 const [oldReal,newReal]=await Promise.all([realpath(oldDir),realpath(newDir)]);
 const [a,b]=await Promise.all([stat(oldReal),stat(newReal)]);
 if(oldReal===newReal||(a.dev===b.dev&&a.ino===b.ino)||
   !a.isDirectory()||!b.isDirectory())
  throw Error('F169: independent builds required');
 const candidates=plan?parseSafeJson(await readBoundedLocalText(plan,{maxBytes:5*1024*1024})):[];
 const result=await reviewTwoCompiledSiteMigration({
  beforeDirectory:oldReal,afterDirectory:newReal,candidates
 });
 process.stdout.write(JSON.stringify(result)+'\n');
 if(result.structuralMigrationReviewRequired)process.exitCode=1;
}catch(error){
 // Keep untrusted paths, URL fragments and source HTML out of CI logs.
 process.stderr.write('F169: offline migration check failed: '+safeCliDiagnostic(error)+'\n');
 process.exitCode=2;
}
