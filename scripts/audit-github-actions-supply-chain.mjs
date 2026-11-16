/** F161: read-only audit of actual workflow files in the candidate checkout. */
import {readdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {inspectWorkflowSource,summarizeWorkflowSupplyChain}
 from '../src/workflow-supply-chain-review.mjs';
if(process.argv.length!==2)throw Error('F161: no arbitrary paths or arguments allowed');
const dir=resolve('.github/workflows');
const names=readdirSync(dir,{withFileTypes:true})
 .filter(x=>x.name.endsWith('.yml')||x.name.endsWith('.yaml'))
 .map(x=>{
  if(!x.isFile())throw Error('F161: workflow must be regular file');
  return x.name;
 }).sort();
if(names.length<30)throw Error('F161: incomplete workflow directory inventory');
const scans=names.map(name=>inspectWorkflowSource(name,
 readFileSync(join(dir,name),'utf8')));
const result=summarizeWorkflowSupplyChain(scans);
process.stdout.write(JSON.stringify(result)+'\n');
if(result.findings>0)process.exitCode=1;
