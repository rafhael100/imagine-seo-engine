/** F160: run only on a reviewed, immutable base SHA and local checkout. */
import {execFileSync} from 'node:child_process';
import {inspectCompleteGitDiffStatuses} from '../src/complete-git-diff-review.mjs';
const [base,...extra]=process.argv.slice(2);
if(extra.length||typeof base!=='string'||!/^[a-f0-9]{40}$/.test(base))
 throw Error('F160: exact immutable baseline SHA required');
try{
 execFileSync('git',['merge-base','--is-ancestor',base,'HEAD'],{stdio:'ignore'});
}catch{
 throw Error('F160: baseline is not an ancestor of checkout HEAD');
}
let changed;
try{
 changed=execFileSync('git',['diff','--name-status','-z','--find-renames=50%',
   '--diff-filter=ACDMRT',base,'HEAD'],{
  maxBuffer:4*1024*1024
 });
}catch{
 throw Error('F160: read-only local git diff failed');
}
const result=inspectCompleteGitDiffStatuses(changed);
process.stdout.write(JSON.stringify(result)+'\n');
