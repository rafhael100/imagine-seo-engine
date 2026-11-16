/** F160: run only on a reviewed, immutable base SHA and local checkout. */
import {execFileSync} from 'node:child_process';
import {categorizeReleaseDiff} from '../src/release-diff-risk.mjs';
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
 changed=execFileSync('git',['diff','--name-only','--diff-filter=ACMRT','-z',base,'HEAD'],{
  maxBuffer:4*1024*1024
 });
}catch{
 throw Error('F160: read-only local git diff failed');
}
const paths=changed.toString('utf8').split('\0').filter(Boolean);
const result=categorizeReleaseDiff(paths);
process.stdout.write(JSON.stringify(result)+'\n');
