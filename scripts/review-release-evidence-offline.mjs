/** F162 private operator-only offline CLI. No receipt body or file paths in stdout. */
import {lstatSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {assessSeoReleaseEvidence} from '../src/release-evidence-inventory.mjs';
if(process.argv.length!==3)throw Error('F162: one private local receipt path required');
const file=resolve(process.argv[2]);
let stat;
try{stat=lstatSync(file);}catch{throw Error('F162: unreadable receipt inventory');}
if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536||
   (process.platform!=='win32'&&(stat.mode&0o077)!==0))
 throw Error('F162: private regular file 0600 and size limit required');
let input;
try{input=JSON.parse(readFileSync(file,'utf8'));}
catch{throw Error('F162: invalid private receipt inventory');}
const result=assessSeoReleaseEvidence(input);
process.stdout.write(JSON.stringify(result)+'\n');
process.exitCode=1; // A receipt inventory is never a GO signal, even when complete.
