/**
 * RC39 release QA: independent, read-only route and flag-switch contract
 * against the pinned public Imagine Comercial Astro build.
 * It does not send traffic or verify editorial translation quality.
 * Negative mutation runs ONLY on a disposable generated HTML in Actions.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const [arg,...extra]=process.argv.slice(2);
if(process.env.GITHUB_ACTIONS!=='true'||!arg||extra.length)
  throw Error('RC39 flags QA: GitHub Actions and one pinned Comercial dist required');
const root=resolve(arg);
if(root.split(sep).slice(-3).join('/')!=='.qa/comercial-i18n/dist')
  throw Error('RC39 flags QA: only disposable Comercial build may be inspected');
const source=resolve(root,'..','src');
const {sitePages}=await import(pathToFileURL(join(source,'data/services.mjs')).href);
const {languageSwitchTargets,languageAlternates,internationalPagePaths}=
  await import(pathToFileURL(join(source,'data/i18n.mjs')).href);
const allRoutes=sitePages.map(({path})=>path);
assert.equal(allRoutes.length,45,'RC39: pinned Astro route inventory changed');
assert.equal(new Set(allRoutes).size,allRoutes.length,'RC39: duplicate static routes');
assert.equal(internationalPagePaths.length,26,'RC39: international route inventory changed');
assert.ok(internationalPagePaths.every(x=>allRoutes.includes(x)));

const localeKeys=['pt-BR','en','es'];
const getFile=path=>join(root,path==='/'?'index.html':path.slice(1)+'index.html');
const extractNav=html=>{
  const nodes=[...html.matchAll(/<nav\b[^>]*\bclass="locale-switcher"[^>]*>([\s\S]*?)<\/nav>/gi)];
  assert.equal(nodes.length,1,'RC39: exactly one language-switcher nav required');
  assert.match(nodes[0][0],/\baria-label="[^"]+"/);
  const anchors=[...nodes[0][1].matchAll(/<a\b[^>]*\bclass="locale-option"[^>]*>/gi)].map(x=>x[0]);
  assert.equal(anchors.length,3,'RC39: exactly three flag links required');
  const entries=new Map();
  for(const anchor of anchors){
    const lang=anchor.match(/\blang="([^"]+)"/i)?.[1];
    const hreflang=anchor.match(/\bhreflang="([^"]+)"/i)?.[1];
    const href=anchor.match(/\bhref="([^"]+)"/i)?.[1];
    const accessible=anchor.match(/\baria-label="([^"]+)"/i)?.[1];
    assert.ok(localeKeys.includes(lang),'RC39: unexpected selector locale');
    assert.equal(hreflang,lang,'RC39: flag hreflang differs from link locale');
    assert.ok(accessible?.trim(),'RC39: flag needs accessible label');
    assert.ok(href?.startsWith('/')&&!href.startsWith('//'),
      'RC39: selector must link to a local reviewed route');
    assert.ok(!entries.has(lang),'RC39: duplicate selector locale');
    entries.set(lang,{href,selected:/\baria-current="page"/i.test(anchor)});
  }
  assert.deepEqual([...entries.keys()].sort(),[...localeKeys].sort());
  return entries;
};
function checkPage(path,html){
  const lang=path.startsWith('/en/')?'en':path.startsWith('/es/')?'es':'pt-BR';
  const htmlLang=html.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1];
  assert.equal(htmlLang,lang,'RC39: HTML root locale differs from route');
  const flags=extractNav(html);
  const expected=languageSwitchTargets(path);
  for(const code of localeKeys){
    assert.equal(flags.get(code).href,expected[code],
      'RC39: wrong selector translation counterpart');
    assert.ok(allRoutes.includes(expected[code]),'RC39: selector points to missing route');
  }
  // Some PT-only articles have no translated equivalent and intentionally
  // link to EN/ES home: don't fabricate SEO equivalence on those pages.
  const group=languageAlternates(path);
  if(group){
    assert.equal(flags.get(lang).selected,true,'RC39: translated page must mark active locale');
    assert.equal(Object.values(flags).filter(x=>x.selected).length,1,
      'RC39: exactly one active locale on translated page');
    for(const code of localeKeys)
      assert.equal(flags.get(code).href,group[code]);
  }
  const blocks=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const objects=blocks.map(x=>JSON.parse(x[1]));
  const pageData=objects.filter(x=>x['@type']==='WebPage');
  assert.equal(pageData.length,1,'RC39: one WebPage JSON-LD expected');
  assert.equal(pageData[0].inLanguage,lang,'RC39: structured-data language mismatch');
}
for(const path of allRoutes)
  checkPage(path,await readFile(getFile(path),'utf8'));
console.log('RC39: 45 route flag-switch links and WebPage locales verified, including 26 EN/ES routes');

// Negative proof on a disposable build: SEO head is still unchanged, but
// the human-facing Spanish flag becomes wrong. The QA must reject it.
const changedFile=getFile('/en/');
const original=await readFile(changedFile,'utf8');
const nav=extractNav(original);
assert.equal(nav.get('es').href,'/es/');
const broken=original.replace(
  /<a\b[^>]*\bclass="locale-option"[^>]*\blang="es"[^>]*>/i,
  tag=>tag.replace('href="/es/"','href="/es/faq/"')
);
assert.notEqual(broken,original,'RC39: negative flag mutation did not apply');
try{
  await writeFile(changedFile,broken);
  assert.throws(()=>checkPage('/en/',broken),
    /wrong selector translation counterpart/);
  console.log('RC39: misdirected Spanish flag blocked on real Astro HTML');
}finally{
  await writeFile(changedFile,original);
}
checkPage('/en/',await readFile(changedFile,'utf8'));
console.log('RC39: unmodified English homepage restored and verified');
