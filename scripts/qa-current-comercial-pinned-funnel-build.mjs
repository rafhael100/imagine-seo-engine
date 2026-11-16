/**
 * SEO F158 — verify current PINNED Imagine Comercial Astro candidate
 * after its actual build. No network probes, Google, logging URLs/PII,
 * build mutation, publication or customer traffic.
 *
 * Run only inside disposable GitHub Actions at exact .qa path.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,sep,join} from 'node:path';
import {auditStaticSite} from '../src/audit-static.mjs';

const [target,...extra]=process.argv.slice(2);
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||
   !target||extra.length)
 throw Error('SEO F158: disposable CI-only Astro build required');
const root=resolve(target);
if(root.split(sep).slice(-3).join('/')!=='.qa/comercial-current/dist')
 throw Error('SEO F158: target must be private disposable candidate build');

const report=await auditStaticSite(root,{
 siteUrl:'https://imaginecomunicacao.com.br/',
 strictPublicHead:true,
 allowedLanguages:['pt-BR','en','es','en-US','es-ES'],
 checkHreflang:true
});
if(report.summary.pages<45||report.summary.errors!==0||
   report.summary.warnings!==0)
 throw Error('SEO F158: current Comercial candidate fails strict build SEO review');
const cases=[
 {file:'index.html',lang:'pt-BR',title:'Das visitas às oportunidades.',
  clue:'hipóteses fictícias de conversão',contact:'/contato/'},
 {file:'en/index.html',lang:'en',title:'From visits to opportunities.',
  clue:'hypothetical conversion assumptions',contact:'/en/contact/'},
 {file:'es/index.html',lang:'es',title:'De visitas a oportunidades.',
  clue:'hipótesis ficticias',contact:'/es/contact/'}
];
let reviewCount=0;
for(const row of cases){
 const html=await readFile(join(root,row.file),'utf8');
 assert.match(html,new RegExp('<html\\s+lang=["\\x27]'+row.lang+'["\\x27]'));
 assert.ok(html.includes(row.title),'F158: missing localized visible funnel heading');
 const start=html.indexOf('data-growth-calculator');
 assert.ok(start>=0,'F158: missing actual client-side calculator');
 const opening=html.lastIndexOf('<section',start);
 const closing=html.indexOf('</section>',start);
 assert.ok(opening>=0&&closing>start,
  'F158: invalid calculator section boundaries');
 const snippet=html.slice(opening,closing+'</section>'.length);
 assert.ok(snippet.includes('data-growth-weekly'),'F158: missing local numeric input');
 assert.ok(snippet.includes('data-growth-scenario'),'F158: missing scenarios');
 assert.ok(snippet.includes('data-growth-calculate'),'F158: missing calculation interaction');
 assert.ok(snippet.includes(row.clue),'F158: missing hypothetical scenario disclaimer');
 assert.ok(snippet.includes(row.contact),'F158: wrong locale customer-initiated CTA');
 assert.ok(!/<form(?:\s|>)/i.test(snippet),
  'F158: calculator must not become an automatic lead capture form');
 assert.ok(!/<input[^>]+type=["'](?:email|tel|password)["']/i.test(snippet),
  'F158: calculator cannot silently require personal data');
 assert.ok(!/action=["']https?:\/\//i.test(snippet),
  'F158: calculator must not submit to an external provider');
 assert.ok(html.includes('rel="canonical"'),'F158: missing canonical metadata');
 reviewCount++;
}
process.stdout.write(JSON.stringify({
 contractVersion:'seo-f158-comercial-current-pinned-build-funnel-seo-v1',
 reviewStatus:'human_candidate_release_review_required',
 checkedLocales:reviewCount,
 htmlPages:report.summary.pages,
 technicalSeoErrors:report.summary.errors,
 technicalSeoWarnings:report.summary.warnings,
 funnelClearlyHypothetical:true,
 customerContactOptInOnly:true,
 rawCustomerInputProcessed:false,
 googleSourceConnected:false,
 originSiteDeployed:false,
 publicationAuthorized:false,
 releaseStatus:'HOLD_FRESH_COMMERCIAL_SHA_EDITORIAL_APPSEC_VPS_GO'
})+'\n');
