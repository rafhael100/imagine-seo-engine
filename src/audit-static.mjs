/**
 * SEO-F0 — auditoria read-only de uma compilação estática LOCAL.
 * Sem rede, OAuth, scraping, dados pessoais ou rastreamento de concorrentes.
 * Analisa o HTML produzido (não substitui Chrome/Lighthouse/URL Inspection).
 */
import { readdir, lstat } from 'node:fs/promises';
import {readBoundedLocalText} from './local-input.mjs';
import { resolve, relative, join, sep } from 'node:path';

const HTML_MAX_BYTES = 2 * 1024 * 1024;
const RESOURCE_MAX_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 20000;
const ATTR = /([a-zA-Z][a-zA-Z0-9:-]*)\s*=\s*(["'])(.*?)\2/gs;

function attrs(markup) {
  const result = {};
  for (const match of markup.matchAll(ATTR)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}
function tags(html, name) {
  return [...html.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map(x => x[0]);
}
function getMeta(html, name) {
  return tags(html, 'meta').map(attrs).filter(x => (x.name ?? '').toLowerCase() === name);
}
function routeFromFile(relativePath) {
  const name = relativePath.replace(/\\/g, '/');
  if (name === 'index.html') return '/';
  if (name.endsWith('/index.html')) return '/' + name.slice(0, -'index.html'.length);
  return '/' + name;
}
function normalizeUrl(value, site) {
  try {
    const url = new URL(value, site);
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

async function crawlTree(root, errors) {
  const found = [];
  async function visit(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const info = await lstat(full);
      if (info.isSymbolicLink()) {
        errors.push({ type: 'unsafe_symlink', file: relative(root, full), message: 'Symbolic link skipped' });
        continue;
      }
      if (info.isDirectory()) { await visit(full); continue; }
      if (!info.isFile() || !entry.name.endsWith('.html')) continue;
      if (info.size > HTML_MAX_BYTES) {
        errors.push({ type: 'oversize_html', file: relative(root, full), message: 'HTML over 2 MiB' });
        continue;
      }
      if (found.length >= MAX_PAGES) throw new Error('audit: maximum HTML page count exceeded');
      found.push(full);
    }
  }
  await visit(root);
  return found;
}

/**
 * auditStaticSite(root, {siteUrl}) returns only local-artefact observations.
 * No ranking claims, no live HTTP requests and no guarantees of indexation.
 */
export async function auditStaticSite(root, { siteUrl = 'https://imaginecomunicacao.com.br/', strictPublicHead=false } = {}) {
  if (typeof root !== 'string' || !root) throw new Error('audit: local directory required');
  if(typeof strictPublicHead!=='boolean')throw new Error('audit: invalid strictPublicHead flag');
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash ||
    site.username || site.password || site.port) {
    throw new Error('audit: siteUrl must be an HTTPS origin');
  }
  const base = resolve(root);
  const rootInfo = await lstat(base);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('audit: directory expected');
  const errors = [], warnings = [], pages = [];
  const htmlFiles = await crawlTree(base, errors);
  const known = new Map(), titles = new Map(), canonicals = new Map();

  for (const file of htmlFiles.sort()) {
    const rel = relative(base, file);
    if (rel.startsWith('..' + sep) || rel === '..') throw new Error('audit: unsafe relative file');
    const path = routeFromFile(rel);
    let html;
    try { html=await readSafeHtmlFile(file); }
    catch(error) {
      if(error.message==='audit: unsafe_html_file' || error.code==='ENOENT'){
        errors.push({type:'unsafe_html_file',file:rel,message:'HTML file changed or is unsafe'});
        continue;
      }
      throw error;
    }
    // Metadata must live in the actual <head>. Ignore tags in HTML comments,
    // templates or <body>, which do not provide reliable SEO directives.
    // This remains a bounded static heuristic, not an HTML5 browser parser.
    const headMatch=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
    const head=headMatch?headMatch[1].replace(/<!--[\s\S]*?-->/g,''):'';
    const record = { path, file: rel };
    if (path === '/404.html') {
      // Error document: keep out of XML sitemap and public page totals.
      continue;
    }
    const titleMatch = head.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || '';
    if (!title) errors.push({ type:'missing_title', file:rel, message: 'Page has no title' });
    else if (titles.has(title)) warnings.push({ type:'duplicate_title', file:rel, message: 'Same title as ' + titles.get(title) });
    else titles.set(title, rel);

    const description = getMeta(head,'description');
    if (description.length !== 1 || !description[0].content?.trim()) errors.push({type:'missing_description',file:rel,message:'One non-empty meta description required'});

    const headings = tags(html, 'h1');
    if (headings.length !== 1) errors.push({type:'heading_count',file:rel,message:'One H1 required; found ' + headings.length});

    const canonicalTags = tags(head,'link').map(attrs).filter(x => (x.rel || '').split(/\s+/).includes('canonical'));
    if (canonicalTags.length !== 1 || !canonicalTags[0].href) {
      errors.push({type:'missing_canonical',file:rel,message:'Exactly one canonical link required'});
    } else {
      const canon = canonicalTags[0].href;
      const wanted = new URL(path, site).href;
      if (canon !== wanted) errors.push({type:'wrong_canonical',file:rel,message:'Canonical does not match public URL'});
      if (canonicals.has(canon)) errors.push({type:'duplicate_canonical',file:rel,message:'Canonical shared with ' + canonicals.get(canon)});
      canonicals.set(canon, rel);
    }
    const robots = getMeta(head, 'robots');
    const content = robots.map(x => x.content?.toLowerCase() || '').join(',');
    if (/\bnoindex\b/.test(content)) errors.push({type:'unexpected_noindex',file:rel,message:'Public route contains noindex'});
    if(strictPublicHead){
      // Additional gate for curated public routes, not for arbitrary static builds.
      if(robots.length!==1||!robots[0].content?.trim()){
        errors.push({type:'missing_robots_meta',file:rel,message:'Exactly one robots meta required'});
      }else if(robots[0].content.toLowerCase().replace(/\s+/g,'')!=='index,follow'){
        errors.push({type:'wrong_robots_meta',file:rel,message:'Public route must be index,follow'});
      }
      const og=tags(head,'meta').map(attrs)
        .filter(x=>(x.property??'').toLowerCase()==='og:url');
      if(og.length!==1||!og[0].content?.trim()){
        errors.push({type:'missing_og_url',file:rel,message:'Exactly one og:url required'});
      }else if(og[0].content!==new URL(path,site).href){
        errors.push({type:'wrong_og_url',file:rel,message:'Open Graph URL does not match public canonical'});
      }
    }
    if (!/lang=["']pt-BR["']/i.test(html.slice(0,3000))) warnings.push({type:'missing_ptbr_lang',file:rel,message:'Expected pt-BR language'});

    const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    if (scripts.length === 0) warnings.push({type:'missing_jsonld',file:rel,message:'No JSON-LD (not always necessary)'});
    for (const script of scripts) {
      try { JSON.parse(script[1]); } catch { errors.push({type:'invalid_jsonld',file:rel,message:'Invalid JSON-LD syntax'}); }
    }

    const links = [];
    for (const tag of tags(html,'a')) {
      const href = attrs(tag).href;
      if (!href || href.startsWith('#') || /^(mailto:|tel:)/i.test(href)) continue;
      if (/^javascript:/i.test(href)) {
        errors.push({type:'unsafe_href',file:rel,message:'JavaScript href forbidden'});
        continue;
      }
      const normalized = normalizeUrl(href, site);
      if (normalized.invalid) errors.push({type:'invalid_internal_link',file:rel,message:'Unusable link URL'});
      else if (!normalized.external) links.push(normalized.path);
    }
    record.links = links;
    pages.push(record);
    known.set(path, rel);
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
    errors.push({type:'missing_homepage',file:'index.html',message:'Public homepage missing'});
  }
  for (const page of pages) {
    if (page.path === '/') continue;
    if (inbound.get(page.path).size === 0) {
      warnings.push({type:'orphan_page',file:page.file,message:'No inbound internal navigation link'});
    }
    if (!distances.has(page.path)) {
      warnings.push({type:'unreachable_page',file:page.file,message:'Not reachable from the homepage'});
    } else if (distances.get(page.path) > 3) {
      warnings.push({type:'deep_page',file:page.file,
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
      if (!known.has(link) && link !== '/404.html') errors.push({type:'broken_internal_link',file:page.file,message:'No built page for ' + link});
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
        errors.push({type:large?'oversize_site_resource':'unsafe_site_resource',
          file:name,message:large?'Resource exceeds 5 MiB':'Unsafe local resource'});
        return null;
      }
      throw error;
    }
  };
  const robotsText = await tryText('robots.txt');
  const sitemapXml = await tryText('sitemap.xml');
  if (!robotsText) errors.push({type:'missing_robots',file:'robots.txt',message:'robots.txt missing'});
  else {
    if (/^\s*Disallow:\s*\/\s*$/mi.test(robotsText)) errors.push({type:'robots_block_all',file:'robots.txt',message:'Robots blocks all paths'});
    if (!robotsText.includes(site.origin + '/sitemap.xml')) warnings.push({type:'sitemap_not_in_robots',file:'robots.txt',message:'Sitemap location absent'});
  }
  if (!sitemapXml) errors.push({type:'missing_sitemap',file:'sitemap.xml',message:'Sitemap missing'});
  else {
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(x=>x[1]);
    const locSet = new Set(locs);
    if (locSet.size !== locs.length) errors.push({type:'duplicate_sitemap_url',file:'sitemap.xml',message:'Repeated URL'});
    for(const loc of locs){
      const norm = normalizeUrl(loc,site);
      if (norm.external || norm.invalid || !known.has(norm.path)) errors.push({type:'invalid_sitemap_url',file:'sitemap.xml',message:'Sitemap contains an invalid, missing or external URL'});
    }
    for (const page of pages) {
      const u = new URL(page.path,site).href;
      if (!locSet.has(u)) warnings.push({type:'page_not_in_sitemap',file:page.file,message:'Public page missing from sitemap'});
    }
  }
  return {
    summary: { pages: pages.length, errors: errors.length, warnings: warnings.length },
    // Explicit public route inventory detects accidental replacements even if
    // the total HTML page count stays constant.
    routes:pages.map(page=>page.path).sort(),
    graph, errors, warnings
  };
}
