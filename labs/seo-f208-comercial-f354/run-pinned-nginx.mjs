#!/usr/bin/env node
/** F208: the same real F354 build under F197's existing isolated CI lifecycle. */
import {runPinnedComercialNginxLab} from
 '../seo-f197-real-f348-compose/run-comercial-f348-compose.mjs';
import {F354} from './review-pinned-builds.mjs';

async function main(){
 if(process.argv.length!==3)throw Error('F208: one pinned compiled build required');
 const {byteIdenticalCompiledHtml,...result}=await runPinnedComercialNginxLab({
  buildDirectory:process.argv[2],expectedCommitSha:F354
 });
 process.stdout.write(JSON.stringify({
  contractVersion:'seo-f208-real-f354-isolated-nginx-compose-e2e-v1',
  ...result,byteIdenticalRealF354Html:byteIdenticalCompiledHtml
 })+'\n');
}
main().catch(()=>{
 process.stderr.write('SEO F208: isolated F354 Docker/Nginx proof failed safely\n');
 process.exitCode=1;
});
