#!/usr/bin/env node
/**
 * SEO F194 — two IMMUTABLE real Comercial Astro builds, before and after
 * truthful Portal checkout readiness disclosures. All input is local public
 * HTML, with no Google access, redirects, session, customer or production.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';

const SHA=/^[0-9a-f]{40}$/;
const locales=Object.freeze([
 {code:'pt-BR',page:'index.html',
  marker:'contratação pública ainda não está disponível'},
 {code:'en',page:'en/index.html',marker:'Public checkout is not available'},
 {code:'es',page:'es/index.html',marker:'No existe checkout público'}
]);
const matchStatus=html=>{
 const found=[...html.matchAll(
  /<p\b([^>]*\bdata-choice-portal-readiness\b[^>]*)>([\s\S]*?)<\/p>/gi
 )];
 return found;
};
const readHtml=(folder,page)=>{
 const path=join(folder,page);
 const stat=lstatSync(path);
 if(!stat.isFile()||stat.isSymbolicLink()||
    stat.size<200||stat.size>4*1024*1024)
  throw Error('F194: unsafe actual public HTML');
 return new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(path));
};
function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||!SHA.test(args[2])||!SHA.test(args[3])||
    args[2]===args[3])
  throw Error('F194: distinct immutable Comercial SHAs required');
 const [beforePath,afterPath]=args;
 if(typeof beforePath!=='string'||!beforePath||
    typeof afterPath!=='string'||!afterPath)
  throw Error('F194: two distinct local Astro builds required');
 const before=resolve(beforePath),after=resolve(afterPath);
 if(before===after)throw Error('F194: distinct local build directories required');

 let checked=0;
 for(const locale of locales){
  const old=readHtml(before,locale.page);
  const current=readHtml(after,locale.page);
  if(matchStatus(old).length!==0)
   throw Error('F194: the old pinned build already has the claimed new disclosure');
  const sections=matchStatus(current);
  if(sections.length!==1)
   throw Error('F194: new public site must show exactly one readiness notice per locale');
  const [tagAttributes,contents]=sections[0].slice(1);
  if(!/\bdata-code="private_single_preview_only"/.test(tagAttributes)||
     !/\baria-live="polite"/.test(tagAttributes)||
     !contents.includes(locale.marker))
   throw Error('F194: missing truthful initial Portal status in compiled HTML');

  // A visible notice must not be a disguised automatic checkout or
  // private Portal URL. Only the separate optional WhatsApp conversation
  // stays available to the visitor.
  if(/<a\b/i.test(contents)||/portal-dev|_preview\/portal\/shop|<form\b/i.test(contents))
   throw Error('F194: private checkout URL or active form leaked into readiness copy');
  checked++;
 }
 process.stdout.write(JSON.stringify({
  contractVersion:'seo-f194-pinned-comercial-portal-status-build-v1',
  pinnedBeforeRevisionVerified:true,
  pinnedAfterRevisionVerified:true,
  realPublicAstroLanguagesAudited:checked,
  actualHtmlRead:true,
  oldVersionHasNoReadinessDisclosure:true,
  newVersionHasExactlyOneDisclosurePerLocale:true,
  publicCheckoutAuthorized:false,
  productionRedirectsChanged:0,
  releaseStatus:'HOLD_PORTAL_CHECKOUT_AUTH_AND_HUMAN_REVIEW'
 })+'\n');
}
try{main();}catch{
 // Never log private absolute paths or any URLs from a malformed input file.
 process.stderr.write('SEO F194: fixed Comercial Astro readiness regression HOLD\n');
 process.exitCode=1;
}
