/** F164: inspect only the two reviewed local workflow paths. */
import {readFileSync} from 'node:fs';
import {reviewCommercialWorkflowParity} from '../src/commercial-workflow-sha-parity.mjs';
if(process.argv.length!==2)throw Error('F164: no arbitrary workflow input accepted');
const a=readFileSync('.github/workflows/seo-f158-current-comercial-astro-ci.yml','utf8');
const b=readFileSync('.github/workflows/seo-f159-comercial-browser-qa.yml','utf8');
process.stdout.write(JSON.stringify(reviewCommercialWorkflowParity(a,b))+'\n');
