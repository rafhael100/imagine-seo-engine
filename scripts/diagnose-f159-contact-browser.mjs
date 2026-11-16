/** F159 diagnostic: only public enum values and boolean state; no URLs, PII or screenshots. */
import {spawn} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const candidate=resolve('.qa/comercial-current');
const {chromium}=await import(pathToFileURL(join(candidate,'node_modules/playwright/index.mjs')).href);
const port=44329,root='http://127.0.0.1:'+port;
const server=spawn(join(candidate,'node_modules/.bin/astro'),['preview','--host','127.0.0.1','--port',String(port)],{
 cwd:candidate,env:{...process.env,PUBLIC_PORTAL_LOGIN_URL:''},stdio:'ignore'
});
let browser;
try{
 let ready=false;
 for(let i=0;i<80;i++){
  if(server.exitCode!==null)throw Error('Preview process stopped unexpectedly');
  try{const r=await fetch(root+'/contato/',{signal:AbortSignal.timeout(800)});if(r.ok){ready=true;break;}}catch{}
  await new Promise(done=>setTimeout(done,250));
 }
 if(!ready)throw Error('Preview unavailable');
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 let exceptions=0;
 page.on('pageerror',()=>{exceptions++;});
 await page.goto(root+'/contato/#briefing:~:~:~:contatos',{waitUntil:'networkidle'});
 const result=await page.evaluate(()=>({
   priority:document.querySelector('#priority-choice')?.value??null,
   expectedPriorityOption:!!document.querySelector('#priority-choice option[value="contatos"]'),
   hashRetained:location.hash==='#briefing:~:~:~:contatos',
   previewContainsExpected:document.querySelector('#message-preview')?.textContent?.includes('Receber mais contatos')??false,
   hasChoice:!!document.querySelector('#service-choice')
 }));
 process.stdout.write(JSON.stringify({
  contract:'seo-f159-public-contact-debug-v1',
  ...result,scriptExceptions:exceptions,publicationAuthorized:false
 })+'\\n');
 if(result.priority!=='contatos'||!result.previewContainsExpected||exceptions)process.exitCode=1;
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
