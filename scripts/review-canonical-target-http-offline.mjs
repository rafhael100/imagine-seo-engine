#!/usr/bin/env node
/**
 * SEO F216: operator-only offline review of canonical-target HTTP metadata.
 * Never requests URLs or approves SEO migration or publication.
 * Always exits nonzero, even if all targets returned 200.
 */
import {realpathSync} from 'node:fs';
import {isAbsolute,basename,dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson} from '../src/cli-diagnostics.mjs';
import {reviewCanonicalTargetHttpEvidence}
 from '../src/canonical-target-http-evidence-review.mjs';

const CHECKOUT=fileURLToPath(new URL('../',import.meta.url));
try{
 const args=process.argv.slice(2);
 if(args.length!==1||process.env.IMAGINE_SEO_CANONICAL_REVIEW!=='1'||
    process.env.GITHUB_ACTIONS==='true'||
    !isAbsolute(args[0])||args[0].includes('\0')||
    !args[0].endsWith('.json'))throw Error('unapproved operator input');
 // Resolve parent physically before reading, regardless of the current cwd.
 // The bounded reader rejects a symlink at the final component.
 const privateFile=join(realpathSync.native(dirname(args[0])),basename(args[0]));
 const checkout=realpathSync.native(CHECKOUT);
 if(privateFile===checkout||privateFile.startsWith(checkout+sep))
  throw Error('input inside checkout');
 const text=await readBoundedLocalText(privateFile,{maxBytes:512*1024});
 const input=parseSafeJson(text);
 const report=reviewCanonicalTargetHttpEvidence(input);
 console.log(JSON.stringify(report,null,2));
 // Output is NEVER a release GO signal, even with all statuses 200.
 process.exitCode=1;
}catch{
 console.error('SEO F216: offline operator canonical review unavailable (HOLD)');
 process.exitCode=2;
}
