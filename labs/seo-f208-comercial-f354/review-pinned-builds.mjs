#!/usr/bin/env node
/** F208: immutable Comercial F348 -> F354, rendered before browser JavaScript. */
import assert from 'node:assert/strict';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {filterStaticHtml} from '../../src/head-metadata-attributes.mjs';

export const F348='5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444';
export const F354='9a91afe119fbc5166e9ae94b3e85496e393c38db';
const LOCALES=Object.freeze([
 {page:'index.html',label:'Site · Onepage',title:'Serviços na sua simulação',
  notice:'contratação pública ainda não está disponível'},
 {page:'en/index.html',label:'Website · Onepage',title:'Services in your estimate',
  notice:'Public checkout is not available'},
 {page:'es/index.html',label:'Sitio web · Onepage',title:'Servicios en tu estimación',
  notice:'No existe checkout público'}
]);
const SELECTED=/<ul\b([^>]*\bdata-choice-selected-items\b[^>]*)>([\s\S]*?)<\/ul>/gi;
function checkout(directory,expected){
 const absolute=resolve(directory),real=realpathSync(absolute),info=lstatSync(real);
 if(real!==absolute||!info.isDirectory()||real!==join(dirname(real),'dist'))
  throw Error('F208: canonical compiled Astro directory required');
 const actual=execFileSync('git',['-C',dirname(real),'rev-parse','HEAD'],{
  encoding:'utf8',timeout:10000,maxBuffer:1024,stdio:['ignore','pipe','ignore']
 }).trim();
 if(actual!==expected)throw Error('F208: pinned source revision mismatch');
 return {real,info};
}
function readPage(directory,page){
 const file=join(directory,page),info=lstatSync(file);
 if(!info.isFile()||info.isSymbolicLink()||info.size<200||info.size>4*1024*1024)
  throw Error('F208: invalid compiled public HTML');
 return new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(file));
}
function rendered(html){
 return filterStaticHtml(html,{removeScriptsStyles:true});
}
function verifySelectedServices(html,locale){
 const visible=rendered(html),lists=[...visible.matchAll(SELECTED)];
 if(lists.length!==1)throw Error('F208: one rendered selected-service list required');
 const [whole,attributes,body]=lists[0];
 if(!/\baria-live="polite"/.test(attributes)||/\b(?:hidden|aria-hidden)\b/.test(attributes))
  throw Error('F208: service list must be available before interaction');
 const items=[...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
 if(items.length!==1||items[0][1].trim()!==locale.label||
    !visible.includes(locale.title))
  throw Error('F208: exact localized initial selection missing');
 const notices=[...visible.matchAll(
  /<p\b([^>]*\bdata-choice-portal-readiness\b[^>]*)>([\s\S]*?)<\/p>/gi
 )];
 if(notices.length!==1||
    !/\bdata-code="private_single_preview_only"/.test(notices[0][1])||
    !notices[0][2].includes(locale.notice)||
    /<a\b|<form\b|portal-dev|_preview\/portal\/shop/i.test(notices[0][2]))
  throw Error('F208: truthful Portal readiness must remain visible');
 return whole;
}
export function reviewPinnedF354Builds(beforeDirectory,afterDirectory){
 const before=checkout(beforeDirectory,F348),after=checkout(afterDirectory,F354);
 if(before.real===after.real||
    (before.info.dev===after.info.dev&&before.info.ino===after.info.ino))
  throw Error('F208: independent compiled source builds required');
 let controls=0;
 for(const locale of LOCALES){
  const previous=readPage(before.real,locale.page),current=readPage(after.real,locale.page);
  if([...rendered(previous).matchAll(SELECTED)].length!==0)
   throw Error('F208: old pinned build unexpectedly contains new selected-service list');
  const list=verifySelectedServices(current,locale);
  // Mutate only in memory: a missing, incorrect or duplicated rendered list
  // must fail, even though the source's interactive JS still contains labels.
  for(const replacement of ['',list.replace(locale.label,'Invalid reviewed selection'),list+list]){
   const changed=current.replace(list,replacement);
   assert.notEqual(changed,current,'F208: mutation must affect actual compiled HTML');
   assert.throws(()=>verifySelectedServices(changed,locale),/F208:/);
   controls++;
  }
 }
 return Object.freeze({
  contractVersion:'seo-f208-pinned-f354-selection-build-review-v1',
  independentPinnedSourceHeadsVerified:true,
  compiledAstroLocalesChecked:LOCALES.length,
  selectedServicesPresentBeforeJavascript:true,
  priorBuildHasNoSelectedServiceList:true,
  truthfulPortalReadinessPreserved:true,
  rejectedCompiledHtmlMutations:controls,
  customerDataUsed:false,
  publicCheckoutAuthorized:false,
  publicationAuthorized:false,
  deploymentAuthorized:false,
  releaseStatus:'HOLD_OAUTH_STAGING_AND_HUMAN_REVIEW'
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length!==4)throw Error('F208: two pinned compiled builds required');
  process.stdout.write(JSON.stringify(reviewPinnedF354Builds(...process.argv.slice(2)))+'\n');
 }catch{
  process.stderr.write('SEO F208: compiled selection and source identity review HOLD\n');
  process.exitCode=1;
 }
}
