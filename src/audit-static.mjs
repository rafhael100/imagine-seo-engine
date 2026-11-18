/**
 * SEO-F0 — auditoria read-only de uma compilação estática LOCAL.
 * Sem rede, OAuth, scraping, dados pessoais ou rastreamento de concorrentes.
 * Analisa o HTML produzido (não substitui Chrome/Lighthouse/URL Inspection).
 */
import { opendir, lstat } from 'node:fs/promises';
import {readBoundedLocalText} from './local-input.mjs';
import {inspectHeadMetadata,inspectBodyRobotsMetadata,hasUnsupportedDocumentBase,iterateOpeningHtmlTags,extractHeadTitleText,extractRootHtmlLanguages,iterateJsonLdScriptTexts,strictHreflangLink,filterStaticHtml,extractDocumentSections} from './head-metadata-attributes.mjs';
import { resolve, relative, join, sep } from 'node:path';

const HTML_MAX_BYTES = 2 * 1024 * 1024;
const RESOURCE_MAX_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 20000;
const MAX_FINDINGS = 50000;
const MAX_ANCHORS_PER_PAGE = 1000;
const MAX_TOTAL_ANCHORS = 200000;
const MAX_TOTAL_NAV_LINKS = 100000;
const MAX_JSONLD_PER_PAGE = 128;
const MAX_HREFLANG_PER_PAGE = 16;
const MAX_ROBOTS_LINES = 10000;
const MAX_SITEMAP_LOCS = MAX_PAGES;
const CRAWL_BUDGETS=Object.freeze({maxDirectories:5000,maxEntries:100000,maxDepth:32});
const ATTR = /([a-zA-Z][a-zA-Z0-9:-]*)\s*=\s*(["'])(.*?)\2/gs;
// Locales enabled only by an explicit operator option. This prevents
// accidental acceptance of an unrelated language in a pt-BR-only build.
const SUPPORTED_HTML_LANGUAGES=Object.freeze(['pt-BR','en','es','en-US','es-ES']);
function validateAllowedLanguages(input){
  if(!Array.isArray(input)||input.length<1||input.length>SUPPORTED_HTML_LANGUAGES.length||
    input.some((value,index)=>typeof value!=='string'||
      !SUPPORTED_HTML_LANGUAGES.includes(value)||input.indexOf(value)!==index))
    throw Error('audit: invalid allowedLanguages');
  return new Set(input.map(value=>value.toLowerCase()));
}


/**
 * Offline robots summary for the general Google web crawler. This interprets
 * only exact User-agent groups, global Sitemap lines and full-root rules.
 * It is not an RFC9309 replacement for path-specific precedence or wildcards.
 */
function robotsSiteDirectives(text,site){
  const groups=[];
  let agents=[],directives=[],hasDirectives=false;
  const sitemaps=[];
  const finish=()=>{
    if(agents.length)groups.push({agents:[...agents],directives:[...directives]});
    agents=[];directives=[];hasDirectives=false;
  };
  let lineCount=0;
  for(const entry of text.matchAll(/[^\r\n]+/g)){
    const raw=entry[0];
    if(++lineCount>MAX_ROBOTS_LINES)
      throw Error('audit: robots line budget exceeded');
    const line=raw.split('#',1)[0].trim();
    if(!line)continue;
    const match=line.match(/^([a-z-]+)\s*:\s*(.*?)\s*$/i);
    if(!match)continue;
    const name=match[1].toLowerCase(),value=match[2].trim();
    if(name==='sitemap'){
      if(value)sitemaps.push(value);
      continue;
    }
    if(name==='user-agent'){
      if(hasDirectives)finish();
      if(value)agents.push(value.toLowerCase());
    }else if(name==='disallow'||name==='allow'){
      if(!agents.length)continue;
      hasDirectives=true;
      directives.push({name,path:value});
    }
  }
  finish();
  const googleSpecific=groups.filter(g=>g.agents.includes('googlebot'));
  const applicable=googleSpecific.length?googleSpecific:
    groups.filter(g=>g.agents.includes('*'));
  const rules=applicable.flatMap(g=>g.directives);
  const blocksGooglebot=rules.some(r=>r.name==='disallow'&&r.path==='/')&&
    !rules.some(r=>r.name==='allow'&&r.path==='/');
  return {
    blocksGooglebot,
    sitemapDeclared:sitemaps.includes(site.origin+'/sitemap.xml')
  };
}

function attrs(markup) {
  const result = {};
  for (const match of markup.matchAll(ATTR)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}

function routeFromFile(relativePath) {
  const name = relativePath.replace(/\\/g, '/');
  if (name === 'index.html') return '/';
  if (name.endsWith('/index.html')) return '/' + name.slice(0, -'index.html'.length);
  return '/' + name;
}
function normalizeUrl(value, site, resolutionBase = site) {
  try {
    const url = new URL(value, resolutionBase);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      return { invalid: true };
    if (url.origin !== site.origin) return { external: true };
    if (url.search) return { invalid: true };
    let path = url.pathname;
    if (!path.endsWith('/') && !path.endsWith('.html')) path += '/';
    return { path };
  } catch {
    return { invalid: true };
  }
}

/**
 * Read a local HTML file without following a symlink at the final path, and
 * re-check the size after opening. The crawl's earlier lstat is not trusted.
 * Parent directory races still require a trusted build workspace.
 */
export async function readSafeHtmlFile(file){
  if(typeof file!=='string'||!file)throw new Error('audit: HTML file path required');
  try{
    return await readBoundedLocalText(file,{maxBytes:HTML_MAX_BYTES});
  }catch(error){
    // The shared reader rejects symlinks, file swaps, and growth after stat.
    // Preserve the existing auditor error contract for unsafe local HTML.
    if(error.message?.startsWith('SEO input:'))
      throw new Error('audit: unsafe_html_file');
    throw error;
  }
}

function crawlBudget(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).some(k=>!Object.hasOwn(CRAWL_BUDGETS,k)))
    throw new Error('audit: invalid crawl budget');
  const limits={...CRAWL_BUDGETS,...input};
  for(const key of Object.keys(CRAWL_BUDGETS)){
    const value=limits[key],max=CRAWL_BUDGETS[key];
    if(!Number.isSafeInteger(value)||value< (key==='maxDepth'?0:1)||value>max)
      throw new Error('audit: invalid crawl budget');
  }
  return limits;
}
async function crawlTree(root,errors,limits,emit){
  const found=[];
  let directoryCount=0,entryCount=0;
  async function visit(dir,depth){
    if(depth>limits.maxDepth)
      throw new Error('audit: directory depth budget exceeded');
    if(++directoryCount>limits.maxDirectories)
      throw new Error('audit: directory count budget exceeded');
    // Streaming directory enumeration avoids loading a giant directory listing.
    const handle=await opendir(dir);
    for await(const entry of handle){
      if(++entryCount>limits.maxEntries)
        throw new Error('audit: directory entry budget exceeded');
      const full=join(dir,entry.name);
      const info=await lstat(full);
      if(info.isSymbolicLink()){
        emit(errors,{type:'unsafe_symlink',file:relative(root,full),message:'Symbolic link skipped'});
        continue;
      }
      if(info.isDirectory()){await visit(full,depth+1);continue;}
      if(!info.isFile()||!entry.name.endsWith('.html'))continue;
      if(info.size>HTML_MAX_BYTES){
        emit(errors,{type:'oversize_html',file:relative(root,full),message:'HTML over 2 MiB'});
        continue;
      }
      if(found.length>=MAX_PAGES)
        throw new Error('audit: maximum HTML page count exceeded');
      found.push(full);
    }
  }
  await visit(root,0);
  return found;
}

/**
 * auditStaticSite(root, {siteUrl}) returns only local-artefact observations.
 * No ranking claims, no live HTTP requests and no guarantees of indexation.
 */
export async function auditStaticSite(root, { siteUrl = 'https://imaginecomunicacao.com.br/', strictPublicHead=false, crawlLimits={}, allowedLanguages=['pt-BR'], checkHreflang=false, includeHreflangDeclarations=false } = {}) {
  if (typeof root !== 'string' || !root) throw new Error('audit: local directory required');
  if(typeof strictPublicHead!=='boolean')throw new Error('audit: invalid strictPublicHead flag');
  const acceptedLanguages=validateAllowedLanguages(allowedLanguages);
  if(typeof checkHreflang!=='boolean'||(checkHreflang&&acceptedLanguages.size<2))
    throw Error('audit: invalid checkHreflang option');
  if(typeof includeHreflangDeclarations!=='boolean'||
     (includeHreflangDeclarations&&!checkHreflang))
    throw Error('audit: hreflang evidence requires validated hreflang mode');
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash ||
    site.username || site.password || site.port) {
    throw new Error('audit: siteUrl must be an HTTPS origin');
  }
  const base = resolve(root);
  const rootInfo = await lstat(base);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('audit: directory expected');
  const errors = [], warnings = [], pages = [];
  // No partial success: abort before emitting an unbounded diagnostics report.
  const emit=(list,issue)=>{
    if(errors.length+warnings.length>=MAX_FINDINGS)
      throw Error('audit: findings budget exceeded');
    list.push(issue);
  };
  let totalNavLinks=0,totalAnchors=0;
  const htmlFiles = await crawlTree(base, errors, crawlBudget(crawlLimits),emit);
  const known = new Map(), titles = new Map(), descriptions = new Map(), canonicals = new Map();

  for (const file of htmlFiles.sort()) {
    const rel = relative(base, file);
    if (rel.startsWith('..' + sep) || rel === '..') throw new Error('audit: unsafe relative file');
    const path = routeFromFile(rel);
    let html;
    try { html=await readSafeHtmlFile(file); }
    catch(error) {
      if(error.message==='audit: unsafe_html_file' || error.code==='ENOENT'){
        emit(errors,{type:'unsafe_html_file',file:rel,message:'HTML file changed or is unsafe'});
        continue;
      }
      throw error;
    }
    // Strip HTML comments before scanning metadata, navigation, headings or
    // JSON-LD; commented-out markup cannot constitute public SEO evidence.
    const publicHtml=filterStaticHtml(html);
    // BASE can alter even fragment/root-relative resolution. Do not claim a
    // navigation approval while its document.baseURI behavior is unsupported.
    if(hasUnsupportedDocumentBase(publicHtml))
      emit(errors,{type:'unsupported_base_href',file:rel,
        message:'Document BASE href requires explicit navigation metadata review'});
    // F206: literal </head> or </body> inside raw text/quoted values is not
    // a document boundary and must not hide later metadata or navigation.
    const documentSections=extractDocumentSections(publicHtml);
    // HTML inside raw <script>/<style> text is not actual metadata in
    // the document head. JSON-LD is checked separately from publicHtml.
    const head=filterStaticHtml(documentSections.head,{removeScriptsStyles:true});
    const body=documentSections.body;
    // A title or anchor embedded in a script/style literal is not a visible
    // page heading or navigation link. Keep JSON-LD detection separate.
    const visibleBody=filterStaticHtml(body,{removeScriptsStyles:true});
    const record = { path, file: rel };
    const headMetadata=inspectHeadMetadata(head);
    for(let i=0;i<headMetadata.invalidCount;i++){
      emit(errors,{type:'ambiguous_head_metadata',file:rel,
        message:'Head metadata has ambiguous attributes or unsupported encoding'});
    }
    const headMeta=name=>headMetadata.metas.filter(
      item=>(item.name??'').toLowerCase()===name);
    // F209: Google also respects robots META in BODY. Only aggregate its
    // restrictions; canonical/description and strict HEAD evidence stay HEAD-only.
    const bodyMetadata=inspectBodyRobotsMetadata(visibleBody);
    for(let i=0;i<bodyMetadata.invalidCount;i++){
      emit(errors,{type:'ambiguous_body_robots_meta',file:rel,
        message:'Body indexing metadata has ambiguous attributes or unsupported encoding'});
    }
    const bodyMeta=name=>bodyMetadata.metas.filter(
      item=>(item.name??'').toLowerCase()===name);
    // F113: even if a draft's robots=noindex header is deleted or changed,
    // a private editorial marker must NEVER be present in a publishable build.
    // The marker is inserted by the F112 offline renderer. A legacy-text
    // fallback covers previews created just before the explicit marker.
    // This is evidence of a leak, NOT a production authorization check.
    const hasPrivatePreviewMarker=[...headMeta('imagine:editorial-preview'),
      ...bodyMeta('imagine:editorial-preview')]
      .some(meta=>meta.content==='private-unpublished-review');
    const hasLegacyPrivatePreviewText=
      visibleBody.includes('RASCUNHO INTERNO — NÃO PUBLICAR NEM INDEXAR');
    if(hasPrivatePreviewMarker||hasLegacyPrivatePreviewText){
      emit(errors,{
        type:'private_editorial_preview_in_public_build',
        file:rel,
        message:'Private editorial preview included in public build'
      });
    }
    if (path === '/404.html') {
      // Error document: keep out of XML sitemap and public page totals.
      continue;
    }
    const title = extractHeadTitleText(head).replace(/\s+/g, ' ').trim();
    if (!title) emit(errors,{ type:'missing_title', file:rel, message: 'Page has no title' });
    else if (titles.has(title)) emit(warnings,{ type:'duplicate_title', file:rel, message: 'Same title as ' + titles.get(title) });
    else titles.set(title, rel);

    const description = headMeta('description');
    if (description.length !== 1 || !description[0].content?.trim()) {
      emit(errors,{type:'missing_description',file:rel,message:'One non-empty meta description required'});
    } else {
      // F90: detect page-level SEO collisions across ALL public routes,
      // including unchanged articles and dynamically published services.
      // Never include editorial text in findings or report diagnostics.
      const normalized=description[0].content.normalize('NFKC')
        .replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR');
      if(descriptions.has(normalized))
        emit(warnings,{type:'duplicate_description',file:rel,
          message:'Same meta description as '+descriptions.get(normalized)});
      else descriptions.set(normalized,rel);
    }

    // Raw/RCDATA text and quoted examples cannot create actual headings.
    // Reuse the bounded lexer already used for navigation and static IDs.
    let headingCount=0;
    for(const tag of iterateOpeningHtmlTags(visibleBody))
      if(tag.name==='h1')headingCount++;
    if (headingCount !== 1) emit(errors,{type:'heading_count',file:rel,message:'One H1 required; found ' + headingCount});

    // HTML rel tokens are ASCII case-insensitive: CANONICAL is a valid rel.
    const canonicalTags = headMetadata.links.filter(x =>
      typeof x.rel==='string' && x.rel.toLowerCase().split(/[\t\n\f\r ]+/).includes('canonical'));
    if (canonicalTags.length !== 1 || !canonicalTags[0].href) {
      emit(errors,{type:'missing_canonical',file:rel,message:'Exactly one canonical link required'});
    } else {
      const canon = canonicalTags[0].href;
      const wanted = new URL(path, site).href;
      if (canon !== wanted) emit(errors,{type:'wrong_canonical',file:rel,message:'Canonical does not match public URL'});
      if (canonicals.has(canon)) emit(errors,{type:'duplicate_canonical',file:rel,message:'Canonical shared with ' + canonicals.get(canon)});
      canonicals.set(canon, rel);
    }
    const robots = headMeta('robots');
    const googlebotMeta=headMeta('googlebot');
    const applicableRobots=[...robots,...bodyMeta('robots')];
    const applicableGooglebot=[...googlebotMeta,...bodyMeta('googlebot')];
    const directiveTokens=items=>items.flatMap(item=>
      typeof item.content==='string'?item.content.toLowerCase()
        // "none" is also a valid max-image-preview parameter. Consume that
        // complete parameter without hiding a separate none/noindex/nofollow.
        // Invalid/unknown parameter syntax retains the conservative old path.
        .replace(/(^|[,\s])max-image-preview\s*:\s*(?:none|standard|large)(?=$|[,\s])/g,'$1')
        .split(/[,\s]+/):[])
      .filter(Boolean);
    const publicRobots=directiveTokens(applicableRobots);
    const googlebotDirectives=directiveTokens(applicableGooglebot);
    // Match the directive name after metadata decoding, not its date value.
    // As in F207, every schedule needs review regardless of the current time.
    // META has no HTTP agent-prefix semantics; HEAD/BODY restrictions combine.
    if([...applicableRobots,...applicableGooglebot].some(item=>
      typeof item.content==='string'&&
      /(?:^|[,\s])unavailable_after\s*:/i.test(item.content)))
      emit(errors,{type:'meta_robots_policy_review_required',file:rel,
        message:'Scheduled meta robots restriction requires explicit indexation review'});
    // "none" is defined as noindex,nofollow; Googlebot-specific directives
    // can override a general robots "index,follow" declaration.
    if(publicRobots.includes('noindex')||publicRobots.includes('none'))
      emit(errors,{type:'unexpected_noindex',file:rel,message:'Public route contains noindex/none'});
    if(publicRobots.includes('nofollow'))
      emit(errors,{type:'unexpected_nofollow',file:rel,
        message:'Public route prevents crawler link following'});
    if(googlebotDirectives.some(x=>['noindex','none','nofollow'].includes(x)))
      emit(errors,{type:'googlebot_indexing_blocked',file:rel,
        message:'Googlebot-specific meta prevents indexation or link following'});
    if(strictPublicHead&&googlebotMeta.length>1)
      emit(errors,{type:'duplicate_googlebot_meta',file:rel,
        message:'Multiple Googlebot meta directives require manual review'});
    if(strictPublicHead){
      // Additional gate for curated public routes, not for arbitrary static builds.
      if(robots.length!==1||!robots[0].content?.trim()){
        emit(errors,{type:'missing_robots_meta',file:rel,message:'Exactly one robots meta required'});
      }else if(robots[0].content.toLowerCase().replace(/\s+/g,'')!=='index,follow'){
        emit(errors,{type:'wrong_robots_meta',file:rel,message:'Public route must be index,follow'});
      }
      const og=headMetadata.metas
        .filter(x=>(x.property??'').toLowerCase()==='og:url');
      if(og.length!==1||!og[0].content?.trim()){
        emit(errors,{type:'missing_og_url',file:rel,message:'Exactly one og:url required'});
      }else if(og[0].content!==new URL(path,site).href){
        emit(errors,{type:'wrong_og_url',file:rel,message:'Open Graph URL does not match public canonical'});
      }
    }
    // Only the real root <html> lang is evidence. Body markup, scripts,
    // comments and multiple lang attributes must not spoof its locale.
    const rootLanguages=extractRootHtmlLanguages(publicHtml);
    if(rootLanguages.length!==1 || !acceptedLanguages.has(rootLanguages[0].toLowerCase()))
      emit(warnings,{type:acceptedLanguages.size===1?'missing_ptbr_lang':'invalid_root_lang',
        file:rel,message:acceptedLanguages.size===1
          ?'Exactly one pt-BR language on root html required'
          :'Exactly one approved language on root html required'});

    if(checkHreflang){
      record.language=rootLanguages.length===1&&
        acceptedLanguages.has(rootLanguages[0].toLowerCase())
        ?rootLanguages[0].toLowerCase():null;
      const alternateLanguages=new Map();
      let alternateCount=0;
      for(const markup of headMetadata.linkMarkup){
        const checked=strictHreflangLink(markup);
        // An alternate without hreflang can be RSS; it is not a translation.
        if(!checked.candidate)continue;
        if(++alternateCount>MAX_HREFLANG_PER_PAGE)
          throw Error('audit: hreflang link budget exceeded');
        if(checked.invalid){
          emit(errors,{type:'invalid_hreflang_attributes',file:rel,
            message:'Hreflang link has ambiguous, duplicate or unquoted required attributes'});
          continue;
        }
        const link=checked.link;
        const alternate=link.rel.toLowerCase().split(/\s+/).includes('alternate');
        const language=link.hreflang.trim().toLowerCase();
        if(!alternate||(!acceptedLanguages.has(language)&&language!=='x-default')){
          emit(errors,{type:'invalid_hreflang',file:rel,
            message:'Alternate language must use approved hreflang and rel'});
          continue;
        }
        if(alternateLanguages.has(language)){
          emit(errors,{type:'duplicate_hreflang',file:rel,
            message:'Duplicate hreflang locale on one page'});
          continue;
        }
        const normalized=typeof link.href==='string'?normalizeUrl(link.href,site):{invalid:true};
        const canonical=normalized.path?new URL(normalized.path,site).href:null;
        if(normalized.invalid||normalized.external||link.href!==canonical){
          emit(errors,{type:'invalid_hreflang_url',file:rel,
            message:'Hreflang requires an exact same-origin public canonical URL'});
          continue;
        }
        alternateLanguages.set(language,normalized.path);
      }
      record.alternates=alternateLanguages;
    }

    let jsonldCount=0;
    for (const scriptText of iterateJsonLdScriptTexts(publicHtml)) {
      if(++jsonldCount>MAX_JSONLD_PER_PAGE)
        throw Error('audit: JSON-LD script budget exceeded');
      try { JSON.parse(scriptText); } catch { emit(errors,{type:'invalid_jsonld',file:rel,message:'Invalid JSON-LD syntax'}); }
    }

    if(jsonldCount===0)
      emit(warnings,{type:'missing_jsonld',file:rel,message:'No JSON-LD (not always necessary)'});
    // F91: validate simple static in-page fragments, including no-JS
    // summaries, FAQ anchors and skip links. A generic auditor does not
    // interpret dynamic hash-based UI states such as "#comparar:a:b".
    const localIds=new Set();
    let inspectedTags=0;
    for(const tag of iterateOpeningHtmlTags(body)){
      if(++inspectedTags>50000)throw Error('audit: HTML tag budget exceeded');
      const id=attrs(tag.markup).id;
      if(typeof id==='string'&&id){
        if(localIds.has(id))
          emit(warnings,{type:'duplicate_html_id',file:rel,
            message:'Duplicate static HTML ID may make links and ARIA targets ambiguous'});
        else localIds.add(id);
      }
    }
    const links = [];
    // Relative navigation belongs to the source document's directory. Keep
    // site as the trusted origin; canonical/hreflang/sitemap retain their base.
    const navigationBase = new URL(path, site);
    let anchorCount=0;
    for (const tag of iterateOpeningHtmlTags(body)) {
      if(tag.name!=='a')continue;
      if(++totalAnchors>MAX_TOTAL_ANCHORS)
        throw Error('audit: total anchor budget exceeded');
      if(++anchorCount>MAX_ANCHORS_PER_PAGE)
        throw Error('audit: page anchor budget exceeded');
      const href = attrs(tag.markup).href;
      if (!href)continue;
      if(href.startsWith('#')){
        // Only simple literal ASCII hash links can be checked confidently
        // in static markup. Encoded/semantic fragments need browser review.
        const id=href.slice(1);
        if(/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(id)&&!localIds.has(id))
          emit(warnings,{type:'broken_local_fragment',file:rel,
            message:'In-page fragment target missing from static HTML'});
        continue;
      }
      if(/^(mailto:|tel:)/i.test(href))continue;
      if (/^javascript:/i.test(href)) {
        emit(errors,{type:'unsafe_href',file:rel,message:'JavaScript href forbidden'});
        continue;
      }
      const normalized = normalizeUrl(href, site, navigationBase);
      if (normalized.invalid) emit(errors,{type:'invalid_internal_link',file:rel,message:'Unusable link URL'});
      else if (!normalized.external) {
        if(++totalNavLinks>MAX_TOTAL_NAV_LINKS)
          throw Error('audit: total navigation budget exceeded');
        links.push(normalized.path);
      }
    }
    record.links = links;
    pages.push(record);
    known.set(path, rel);
  }

  // F100: check exact local canonical destinations, language consistency
  // and return links. This is intentionally offline and opt-in.
  if(checkHreflang){
    const byPath=new Map(pages.map(page=>[page.path,page]));
    for(const page of pages){
      const alt=page.alternates;
      if(!alt?.size)continue;
      if(!page.language||alt.get(page.language)!==page.path)
        emit(errors,{type:'hreflang_missing_self',file:page.file,
          message:'Page with alternate languages requires a matching self-reference'});
      for(const [language,targetPath] of alt){
        const target=byPath.get(targetPath);
        if(!target){
          emit(errors,{type:'hreflang_missing_target',file:page.file,
            message:'Hreflang target is not part of this local build'});
          continue;
        }
        if(language==='x-default'){
          // F103: x-default may legitimately point to a standalone neutral
          // selector (without hreflang), but must not silently jump to a
          // DIFFERENT fully-declared translation group. F101 compares only
          // locale targets; x-default requires this additional guard.
          // Do not echo paths, languages or untrusted HTML in findings.
          const fallbackAlternates=target.alternates;
          if(fallbackAlternates?.size){
            const sameSize=fallbackAlternates.size===alt.size;
            const sameTargets=sameSize&&[...alt].every(([locale,canonicalPath])=>
              fallbackAlternates.get(locale)===canonicalPath);
            if(!sameTargets)
              emit(errors,{type:'hreflang_x_default_foreign_cluster',file:page.file,
                message:'X-default points to a page declaring a different hreflang cluster'});
          }
          continue;
        }
        if(target.language!==language)
          emit(errors,{type:'hreflang_language_mismatch',file:page.file,
            message:'Hreflang locale does not match target HTML root language'});
        if(!page.language||target.alternates?.get(page.language)!==page.path)
          emit(errors,{type:'hreflang_missing_return',file:page.file,
            message:'Hreflang target does not return a link to the source locale'});

        // F101: a reciprocal pair is not enough for a multilingual cluster.
        // Every linked translation must declare the SAME reviewed set of
        // canonical locale targets (including optional x-default). Without
        // this, PT<->EN and EN<->ES can look healthy while PT omits ES.
        // Keep at most one generic finding per relationship; never copy
        // source URLs or locale-provided markup into diagnostics.
        const targetAlternates=target.alternates;
        if(targetAlternates?.size){
          const sameSize=targetAlternates.size===alt.size;
          const sameTargets=sameSize&&[...alt].every(([locale,canonicalPath])=>
            targetAlternates.get(locale)===canonicalPath);
          if(!sameTargets)
            emit(errors,{type:'hreflang_cluster_inconsistent',file:page.file,
              message:'Linked translated pages disagree about their hreflang cluster'});
        }
      }
    }
  }

  // Grafo local de navegação: encontrar páginas sem entrada e URLs não
  // alcançáveis desde a homepage, mesmo quando estão no sitemap.
  const graphEdges = new Map(pages.map(page => [page.path, new Set(
    page.links.filter(url => known.has(url))
  )]));
  const inbound = new Map(pages.map(page => [page.path, new Set()]));
  for (const [source, targets] of graphEdges) {
    for (const target of targets) {
      if (source !== target) inbound.get(target).add(source);
    }
  }
  const distances = new Map();
  if (known.has('/')) {
    const pending = ['/'];
    distances.set('/', 0);
    for (let i = 0; i < pending.length; i++) {
      const from = pending[i], depth = distances.get(from);
      for (const next of graphEdges.get(from) ?? []) {
        if (!distances.has(next)) {
          distances.set(next, depth + 1);
          pending.push(next);
        }
      }
    }
  } else {
    emit(errors,{type:'missing_homepage',file:'index.html',message:'Public homepage missing'});
  }
  for (const page of pages) {
    if (page.path === '/') continue;
    if (inbound.get(page.path).size === 0) {
      emit(warnings,{type:'orphan_page',file:page.file,message:'No inbound internal navigation link'});
    }
    if (!distances.has(page.path)) {
      emit(warnings,{type:'unreachable_page',file:page.file,message:'Not reachable from the homepage'});
    } else if (distances.get(page.path) > 3) {
      emit(warnings,{type:'deep_page',file:page.file,
        message:'Page needs '+distances.get(page.path)+' clicks from homepage'});
    }
  }
  const graph = {
    reachable: distances.size,
    unreachable: pages.length - distances.size,
    maxClicks: Math.max(0,...distances.values()),
    orphanPages: pages.filter(p => p.path !== '/' && inbound.get(p.path).size===0).length
  };

  for (const page of pages) {
    for (const link of page.links) {
      if (!known.has(link) && link !== '/404.html') emit(errors,{type:'broken_internal_link',file:page.file,message:'No built page for ' + link});
    }
  }
  // robots/sitemap are untrusted local artifacts too: never follow symlinks,
  // and reject oversized files before loading them into process memory.
  const tryText = async name => {
    try {
      return await readBoundedLocalText(join(base,name),{maxBytes:RESOURCE_MAX_BYTES});
    } catch(error) {
      if(error.code==='ENOENT')return null;
      if(error.message?.startsWith('SEO input:')) {
        const large=/size limit/.test(error.message);
        emit(errors,{type:large?'oversize_site_resource':'unsafe_site_resource',
          file:name,message:large?'Resource exceeds 5 MiB':'Unsafe local resource'});
        return null;
      }
      throw error;
    }
  };
  const robotsText = await tryText('robots.txt');
  const sitemapXml = await tryText('sitemap.xml');
  if (!robotsText) emit(errors,{type:'missing_robots',file:'robots.txt',message:'robots.txt missing'});
  else {
    const directives=robotsSiteDirectives(robotsText,site);
    if(directives.blocksGooglebot)
      emit(errors,{type:'robots_block_all',file:'robots.txt',message:'Robots blocks Googlebot at root'});
    if(!directives.sitemapDeclared)
      emit(warnings,{type:'sitemap_not_in_robots',file:'robots.txt',message:'Sitemap directive absent'});
  }
  if (!sitemapXml) emit(errors,{type:'missing_sitemap',file:'sitemap.xml',message:'Sitemap missing'});
  else {
    // Ignore XML comments so an attacker cannot hide a fake <loc> inside
    // <!-- ... --> and make a missing public URL appear to be covered.
    // This is a static structural heuristic, not a general XML parser.
    const xml=sitemapXml.replace(/<!--[\s\S]*?-->/g,'');
    if(!/<urlset(?:\s|>)/i.test(xml)||!/<\/urlset\s*>/i.test(xml)||
       /<!DOCTYPE/i.test(xml)){
      emit(errors,{type:'invalid_sitemap_structure',file:'sitemap.xml',message:'Valid urlset root required'});
    }
    const locs=[];
    for(const match of xml.matchAll(/<loc\s*>([^<]*)<\/loc\s*>/gi)){
      if(locs.length>=MAX_SITEMAP_LOCS)
        throw Error('audit: sitemap URL budget exceeded');
      locs.push(match[1].trim());
    }
    if(strictPublicHead){
      // The stricter public-site gate requires every loc inside exactly
      // one URL container. A bare loc outside <url> is not a sitemap entry.
      // This is conservative structural validation, not an XML parser.
      let entryCount=0,contained=0,invalidEntry=false;
      for(const entry of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url\s*>/gi)){
        if(++entryCount>MAX_SITEMAP_LOCS)
          throw Error('audit: sitemap entry budget exceeded');
        let inside=0;
        for(const _ of entry[1].matchAll(/<loc\s*>([^<]*)<\/loc\s*>/gi)){
          if(++inside>1)invalidEntry=true;
        }
        if(inside!==1)invalidEntry=true;
        contained+=inside;
      }
      if(entryCount===0||invalidEntry||contained!==locs.length||
         entryCount!==locs.length)
        emit(errors,{type:'invalid_sitemap_entries',file:'sitemap.xml',
          message:'Strict sitemap requires one loc per url entry and no loc outside url'});
    }
    if(locs.length===0)
      emit(errors,{type:'missing_sitemap_urls',file:'sitemap.xml',message:'No sitemap URL entries'});
    const locSet=new Set(locs);
    if(locSet.size!==locs.length)
      emit(errors,{type:'duplicate_sitemap_url',file:'sitemap.xml',message:'Repeated URL'});
    for(const loc of locs){
      const norm=normalizeUrl(loc,site);
      let fragment=false;
      try{fragment=new URL(loc,site).hash!=='';}catch{fragment=true;}
      const canonical=norm.path?new URL(norm.path,site).href:null;
      if(norm.external||norm.invalid||fragment||loc!==canonical||
         !known.has(norm.path))
        emit(errors,{type:'invalid_sitemap_url',file:'sitemap.xml',message:'Sitemap entry is not an exact canonical public URL'});
    }
    for (const page of pages) {
      const u = new URL(page.path,site).href;
      if (!locSet.has(u)) emit(warnings,{type:'page_not_in_sitemap',file:page.file,message:'Public page missing from sitemap'});
    }
  }
  return {
    summary: { pages: pages.length, errors: errors.length, warnings: warnings.length },
    // Explicit public route inventory detects accidental replacements even if
    // the total HTML page count stays constant.
    routes:pages.map(page=>page.path).sort(),
    // F117: local-only locale evidence from parsed root <html lang>; callers
    // can compare declared inventory locales to the actual compiled HTML.
    // Omitted unless the hreflang parser was explicitly enabled.
    ...(checkHreflang?{routeLocales:pages.map(page=>({
      path:page.path,language:page.language
    })).sort((a,b)=>a.path.localeCompare(b.path))}:{}),
    // F124: explicit opt-in returns raw paths ONLY to local trusted reviewers.
    // Never forward this raw evidence to Portal, clients, or signed v1 DTO.
    ...(includeHreflangDeclarations?{routeAlternates:pages.map(page=>({
      path:page.path,
      alternates:[...(page.alternates??new Map())].map(([language,path])=>({language,path}))
    })).sort((a,b)=>a.path.localeCompare(b.path))}:{}),
    graph, errors, warnings
  };
}
