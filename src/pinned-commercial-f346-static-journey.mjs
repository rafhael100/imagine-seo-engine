/**
 * SEO F187 — read-only cross-repository compiled Astro customer-journey gate.
 * Checks the actual PT/EN/ES HTML delivered by the pinned Comercial F346
 * build, not source-file snippets or a manually authored release summary.
 * It does not run a browser, request URLs, authenticate, deploy or index.
 * Browser-interaction proof still belongs to Comercial's Playwright CI.
 */
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

export const PINNED_COMERCIAL_F346_SHA=
 '9c4b29c168ef0d53abfbf44e64c404fbcc8dc01a';
const LOCALES=[
 ['pt-BR','index.html','Simular investimento em site e anúncios'],
 ['en','en/index.html','Estimate website and ads costs'],
 ['es','es/index.html','Estimar costos de sitio y anuncios']
];
const fail=()=>{throw Error('SEO F187: invalid compiled customer-journey evidence');};
function hasTag(html,tag,attr,value=null){
 const pattern=new RegExp('<'+tag+'\\b[^>]*\\b'+attr+'(?:=(?:"[^"]*"|\\x27[^\\x27]*\\x27))?[^>]*>','g');
 return [...html.matchAll(pattern)].some(hit=>value===null||
  hit[0].includes(attr+'="'+value+'"')||
  hit[0].includes(attr+"='"+value+"'"));
}
function countTag(html,tag,attr){
 const pattern=new RegExp('<'+tag+'\\b[^>]*\\b'+attr+'(?:\\s|=|>)','g');
 return [...html.matchAll(pattern)].length;
}
export async function reviewPinnedCommercialF346Build(buildDir,revision){
 if(typeof buildDir!=='string'||buildDir.length<1||buildDir.length>2048||
    revision!==PINNED_COMERCIAL_F346_SHA)fail();
 let checked=0;
 for(const [,relative,action] of LOCALES){
  let html;
  try{html=await readFile(join(buildDir,relative),'utf8');}
  catch{fail();}
  if(html.length<250||html.length>3_000_000||
     !hasTag(html,'section','data-growth-calculator')||
     !hasTag(html,'section','data-choice-preview')||
     !hasTag(html,'section','id','simular-compra')||
     !hasTag(html,'a','data-growth-quote')||
     !hasTag(html,'strong','data-choice-onetime')||
     !hasTag(html,'button','data-choice-copy')||
     countTag(html,'section','data-growth-calculator')!==1||
     countTag(html,'section','data-choice-preview')!==1||
     countTag(html,'a','data-growth-quote')!==1||
     countTag(html,'button','data-choice-copy')!==1)fail();
  const actionLink=html.match(/<a\b[^>]*\bdata-growth-quote\b[^>]*>/);
  const copy=html.match(/<button\b[^>]*\bdata-choice-copy\b[^>]*>/);
  if(!actionLink?.[0].includes('href="#simular-compra"')||
     !copy?.[0].includes(' hidden')||
     !html.includes(action))fail();
  checked++;
 }
 return Object.freeze({
  contractVersion:'seo-f187-pinned-comercial-f346-static-journey-v1',
  sourceRevision:PINNED_COMERCIAL_F346_SHA,
  auditedCompiledLocales:checked,
  anonymousFunnelAndQuoteAnchorPresent:true,
  copyProgressivelyEnhanced:true,
  matchingCanonicalQuoteTarget:true,
  browserInteractionIndependentlyVerifiedInThisGate:false,
  tenantAuthorized:false,
  GscOAuthVerified:false,
  actualRedirectsInstalled:0,
  customerDataCaptured:false,
  publicationAuthorized:false,
  releaseStatus:'HOLD_PORTAL_CRM_GSC_HTTP_STAGING_AND_HUMAN_APPROVAL'
 });
}
