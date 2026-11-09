/**
 * SEO-F0 — auditoria read-only de uma compilação estática LOCAL.
 * Sem rede, OAuth, scraping, dados pessoais ou rastreamento de concorrentes.
 * Analisa o HTML produzido (não substitui Chrome/Lighthouse/URL Inspection).
 */
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, relative, join, sep } from 'node:path';

const HTML_MAX_BYTES = 2 * 1024 * 1024;
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
    if (url.origin !== site.origin) return { external: true };
    if (url.search || url.username || url.password) return { invalid: true };
    let path = url.pathname;
    if (!path.endsWith('/') && !path.endsWith('.html')) path += '/';
    return { path };
  } catch {
    return { invalid: true };
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
export async function auditStaticSite(root, { siteUrl = 'https://imaginecomunicacao.com.br/' } = {}) {
  if (typeof root !== 'string' || !root) throw new Error('audit: local directory required');
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash) {
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
    const html = await readFile(file, 'utf8');
    const record = { path, file: rel };
    if (path === '/404.html') {
      // Error document: keep out of XML sitemap and public page totals.
      continue;
    }
    const titleMatch = html.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || '';
    if (!title) errors.push({ type:'missing_title', file:rel, message: 'Page has no title' });
    else if (titles.has(title)) warnings.push({ type:'duplicate_title', file:rel, message: 'Same title as ' + titles.get(title) });
    else titles.set(title, rel);

    const description = getMeta(html,'description');
    if (description.length !== 1 || !description[0].content?.trim()) errors.push({type:'missing_description',file:rel,message:'One non-empty meta description required'});

    const headings = tags(html, 'h1');
    if (headings.length !== 1) errors.push({type:'heading_count',file:rel,message:'One H1 required; found ' + headings.length});

    const canonicalTags = tags(html,'link').map(attrs).filter(x => (x.rel || '').split(/\s+/).includes('canonical'));
    if (canonicalTags.length !== 1 || !canonicalTags[0].href) {
      errors.push({type:'missing_canonical',file:rel,message:'Exactly one canonical link required'});
    } else {
      const canon = canonicalTags[0].href;
      const wanted = new URL(path, site).href;
      if (canon !== wanted) errors.push({type:'wrong_canonical',file:rel,message:'Canonical does not match public URL'});
      if (canonicals.has(canon)) errors.push({type:'duplicate_canonical',file:rel,message:'Canonical shared with ' + canonicals.get(canon)});
      canonicals.set(canon, rel);
    }
    const robots = getMeta(html, 'robots');
    const content = robots.map(x => x.content?.toLowerCase() || '').join(',');
    if (/\bnoindex\b/.test(content)) errors.push({type:'unexpected_noindex',file:rel,message:'Public route contains noindex'});
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

  for (const page of pages) {
    for (const link of page.links) {
      if (!known.has(link) && link !== '/404.html') errors.push({type:'broken_internal_link',file:page.file,message:'No built page for ' + link});
    }
  }
  const tryText = async name => {
    try { return await readFile(join(base,name),'utf8'); }
    catch(error) { if (error.code==='ENOENT') return null; throw error; }
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
      if (norm.external || norm.invalid || !known.has(norm.path)) errors.push({type:'invalid_sitemap_url',file:'sitemap.xml',message:'URL missing or external: ' + loc.slice(0,180)});
    }
    for (const page of pages) {
      const u = new URL(page.path,site).href;
      if (!locSet.has(u)) warnings.push({type:'page_not_in_sitemap',file:page.file,message:'Public page missing from sitemap'});
    }
  }
  return {
    summary: { pages: pages.length, errors: errors.length, warnings: warnings.length },
    errors, warnings
  };
}
