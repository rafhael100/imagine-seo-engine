import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { auditStaticSite, readSafeHtmlFile } from '../src/audit-static.mjs';

const origin='https://imaginecomunicacao.com.br';
function makePage(route, overrides={}) {
  const { title='Título exclusivo: ' + route, canonical=origin+route,
    description='Conteúdo comercial original para empresas interessadas em serviços digitais.',
    h1='Conheça os serviços da Imagine', noindex=false, links=[] }=overrides;
  return '<!doctype html><html lang="pt-BR"><head><title>'+title+'</title>'+
    '<meta name="description" content="'+description+'">'+
    '<meta name="robots" content="'+(noindex?'noindex':'index,follow')+'">'+
    '<link rel="canonical" href="'+canonical+'">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>'+h1+'</h1>'+
    links.map(href=>'<a href="'+href+'">Visitar</a>').join('')+'</body></html>';
}
async function withSite(overrides, run) {
  const root=await mkdtemp(join(tmpdir(),'imagine-seo-f0-'));
  await mkdir(join(root,'servicos'),{recursive:true});
  await writeFile(join(root,'index.html'),overrides.home || makePage('/',{links:['/servicos/']}));
  await writeFile(join(root,'servicos/index.html'),overrides.service || makePage('/servicos/'));
  await writeFile(join(root,'robots.txt'), overrides.robots ?? 'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
  await writeFile(join(root,'sitemap.xml'), overrides.sitemap ?? '<?xml version="1.0"?><urlset><url><loc>'+origin+'/</loc></url><url><loc>'+origin+'/servicos/</loc></url></urlset>');
  try { return await run(root); } finally { await rm(root,{recursive:true,force:true}); }
}
test('passes valid public routes and sitemap without external calls', async()=>{
  await withSite({}, async root=>{
    const result=await auditStaticSite(root);
    assert.deepEqual(result.summary,{pages:2,errors:0,warnings:0});
  });
});
test('detects accidental noindex and canonical corruption',async()=>{
  await withSite({home:makePage('/',{noindex:true,canonical:origin+'/wrong/'})}, async root=>{
    const r=await auditStaticSite(root);
    assert.ok(r.errors.some(x=>x.type==='unexpected_noindex'));
    assert.ok(r.errors.some(x=>x.type==='wrong_canonical'));
  });
});
test('detects broken internal links and invalid sitemap URL',async()=>{
  await withSite({home:makePage('/',{links:['/servicos/','/not-found/']}),
    sitemap:'<urlset><loc>https://other.example/not-here/</loc></urlset>'}, async root=>{
    const r=await auditStaticSite(root);
    assert.ok(r.errors.some(x=>x.type==='broken_internal_link'));
    assert.ok(r.errors.some(x=>x.type==='invalid_sitemap_url'));
  });
});
test('detects duplicate titles and robots disallow root',async()=>{
  await withSite({service:makePage('/servicos/',{title:'Título exclusivo: /'}),
    robots:'User-agent: *\nDisallow: /\n'}, async root=>{
    const r=await auditStaticSite(root);
    assert.ok(r.warnings.some(x=>x.type==='duplicate_title'));
    assert.ok(r.errors.some(x=>x.type==='robots_block_all'));
  });
});
test('rejects invalid origin and missing directory',async()=>{
  await assert.rejects(auditStaticSite('missing-folder-12345'), /ENOENT/);
  await withSite({}, async root=>{
    await assert.rejects(auditStaticSite(root,{siteUrl:'http://example.org'}), /HTTPS origin/);
  });
});
test('detects malformed JSON-LD and unsafe javascript href',async()=>{
  const broken=makePage('/',{links:['javascript:alert(1)']})
    .replace('{"@context":"https://schema.org","@type":"WebPage"}','{"invalid":');
  await withSite({home:broken}, async root=>{
    const r=await auditStaticSite(root);
    assert.ok(r.errors.some(x=>x.type==='invalid_jsonld'));
    assert.ok(r.errors.some(x=>x.type==='unsafe_href'));
  });
});

test('reports pages present in the sitemap but disconnected from homepage navigation',async()=>{
  await withSite({},async root=>{
    await mkdir(join(root,'campanhas'),{recursive:true});
    await writeFile(join(root,'campanhas/index.html'),makePage('/campanhas/'));
    await writeFile(join(root,'sitemap.xml'),
      '<urlset><url><loc>'+origin+'/</loc></url><url><loc>'+origin+
      '/servicos/</loc></url><url><loc>'+origin+'/campanhas/</loc></url></urlset>');
    const r=await auditStaticSite(root);
    assert.ok(r.warnings.some(x=>x.type==='orphan_page'&&x.file==='campanhas/index.html'));
    assert.ok(r.warnings.some(x=>x.type==='unreachable_page'&&x.file==='campanhas/index.html'));
    assert.equal(r.graph.unreachable,1);
    assert.equal(r.graph.orphanPages,1);
  });
});
test('computes shortest click depth and flags deeply nested navigation',async()=>{
  await withSite({
    home:makePage('/',{links:['/servicos/']}),
    service:makePage('/servicos/',{links:['/nivel2/']})
  },async root=>{
    await mkdir(join(root,'nivel2'),{recursive:true});
    await mkdir(join(root,'nivel3'),{recursive:true});
    await mkdir(join(root,'nivel4'),{recursive:true});
    await writeFile(join(root,'nivel2/index.html'),makePage('/nivel2/',{links:['/nivel3/']}));
    await writeFile(join(root,'nivel3/index.html'),makePage('/nivel3/',{links:['/nivel4/']}));
    await writeFile(join(root,'nivel4/index.html'),makePage('/nivel4/'));
    const map=['/','/servicos/','/nivel2/','/nivel3/','/nivel4/'];
    await writeFile(join(root,'sitemap.xml'),
      '<urlset>'+map.map(p=>'<url><loc>'+origin+p+'</loc></url>').join('')+'</urlset>');
    const r=await auditStaticSite(root);
    assert.equal(r.graph.maxClicks,4);
    assert.equal(r.graph.reachable,5);
    assert.ok(r.warnings.some(x=>x.type==='deep_page'&&x.file==='nivel4/index.html'));
    assert.equal(r.graph.orphanPages,0);
  });
});
test('home page with a self link does not count as an orphan',async()=>{
  await withSite({home:makePage('/',{links:['/','/servicos/']})},async root=>{
    const r=await auditStaticSite(root);
    assert.equal(r.graph.unreachable,0);
    assert.equal(r.graph.reachable,2);
    assert.equal(r.graph.orphanPages,0);
  });
});

test('does not follow a symlinked robots.txt to an arbitrary local file',async()=>{
  await withSite({},async root=>{
    await writeFile(join(root,'private.txt'),'User-agent: *\\nDisallow: /\\n');
    await rm(join(root,'robots.txt'));
    await symlink(join(root,'private.txt'),join(root,'robots.txt'));
    const report=await auditStaticSite(root);
    assert.ok(report.errors.some(x=>x.type==='unsafe_site_resource'&&x.file==='robots.txt'));
    assert.ok(!report.errors.some(x=>x.type==='robots_block_all'));
  });
});

test('rejects oversized sitemap files without reading their contents',async()=>{
  await withSite({},async root=>{
    await writeFile(join(root,'sitemap.xml'),'x'.repeat(5*1024*1024+1));
    const report=await auditStaticSite(root);
    assert.ok(report.errors.some(x=>x.type==='oversize_site_resource'&&x.file==='sitemap.xml'));
  });
});

test('site origin cannot embed user credentials or custom port',async()=>{
  await withSite({},async root=>{
    await assert.rejects(auditStaticSite(root,{siteUrl:'https://user:secret@imaginecomunicacao.com.br/'}),/HTTPS origin/);
    await assert.rejects(auditStaticSite(root,{siteUrl:'https://imaginecomunicacao.com.br:8443/'}),/HTTPS origin/);
  });
});

test('readSafeHtmlFile forbids final-path symlinks even if a crawler raced',async()=>{
  await withSite({},async root=>{
    const unsafe=join(root,'symlink.html');
    await symlink(join(root,'index.html'),unsafe);
    await assert.rejects(readSafeHtmlFile(unsafe),/unsafe_html_file/);
  });
});
test('readSafeHtmlFile enforces size after opening',async()=>{
  await withSite({},async root=>{
    const huge=join(root,'oversize.html');
    await writeFile(huge,'x'.repeat(2*1024*1024+1));
    await assert.rejects(readSafeHtmlFile(huge),/unsafe_html_file/);
  });
});
test('audit rejects unsafe non-http hyperlinks, not just javascript URLs',async()=>{
  const broken=makePage('/',{links:['data:text/html,x','file:///etc/passwd','vbscript:msgbox(1)']});
  await withSite({home:broken},async root=>{
    const out=await auditStaticSite(root);
    assert.equal(out.errors.filter(x=>x.type==='invalid_internal_link').length,3);
  });
});

test('records a deterministic inventory of public routes, excluding 404.html',async()=>{
  await withSite({},async root=>{
    await writeFile(join(root,'404.html'),makePage('/404.html'));
    const report=await auditStaticSite(root);
    assert.deepEqual(report.routes,['/','/servicos/']);
    assert.equal(report.summary.pages,report.routes.length);
  });
});

test('sitemap error messages do not leak untrusted URL secrets',async()=>{
  await withSite({sitemap:'<urlset><loc>https://evil.test/secret?token=PRIVATE123</loc></urlset>'},
    async root=>{
      const result=await auditStaticSite(root);
      assert.ok(result.errors.some(x=>x.type==='invalid_sitemap_url'));
      assert.doesNotMatch(JSON.stringify(result.errors),/PRIVATE123|evil\\.test/);
    });
});

test('valid near-limit HTML remains readable through bounded reader',async()=>{
  await withSite({},async root=>{
    const file=join(root,'almost-large.html');
    const contents='x'.repeat(2*1024*1024);
    await writeFile(file,contents);
    assert.equal((await readSafeHtmlFile(file)).length,contents.length);
  });
});
test('resource symlink rejection is unchanged after shared bounded reader',async()=>{
  await withSite({},async root=>{
    const target=join(root,'private-sitemap.xml');
    await writeFile(target,'<urlset><loc>https://private.test/secret</loc></urlset>');
    await rm(join(root,'sitemap.xml'));
    await symlink(target,join(root,'sitemap.xml'));
    const result=await auditStaticSite(root);
    assert.ok(result.errors.some(x=>x.type==='unsafe_site_resource'&&x.file==='sitemap.xml'));
    assert.ok(result.errors.some(x=>x.type==='missing_sitemap'));
    assert.doesNotMatch(JSON.stringify(result.errors),/private.test\/secret/);
  });
});

test('strict public head detects a missing og:url without changing default audit',async()=>{
  await withSite({},async root=>{
    const regular=await auditStaticSite(root);
    assert.deepEqual(regular.summary,{pages:2,errors:0,warnings:0});
    const strict=await auditStaticSite(root,{strictPublicHead:true});
    assert.equal(strict.errors.filter(x=>x.type==='missing_og_url').length,2);
    assert.equal(strict.errors.some(x=>x.type==='missing_robots_meta'),false);
  });
});
test('strict public head accepts matching canonical and Open Graph URL',async()=>{
  await withSite({},async root=>{
    for(const [rel,route] of [['index.html','/'],['servicos/index.html','/servicos/']]){
      const html=makePage(route).replace('</head>',
        '<meta property="og:url" content="'+origin+route+'"></head>');
      await writeFile(join(root,rel),html);
    }
    const result=await auditStaticSite(root,{strictPublicHead:true});
    assert.equal(result.errors.length,0);
  });
});
test('strict public head blocks wrong OG URL and missing or duplicated meta robots',async()=>{
  const home=makePage('/').replace('</head>',
    '<meta property="og:url" content="https://wrong.example/"></head>')
      .replace('name="robots"','name="not-robots"');
  const service=makePage('/servicos/').replace('</head>',
    '<meta name="robots" content="noindex">'+
    '<meta property="og:url" content="'+origin+'/servicos/"></head>');
  await withSite({home,service},async root=>{
    const result=await auditStaticSite(root,{strictPublicHead:true});
    assert.ok(result.errors.some(x=>x.type==='missing_robots_meta'));
    assert.ok(result.errors.some(x=>x.type==='wrong_og_url'));
    assert.ok(result.errors.some(x=>x.type==='unexpected_noindex'));
    assert.ok(result.errors.some(x=>x.type==='missing_robots_meta'&&x.file==='servicos/index.html'));
  });
});
test('strict public head explicitly rejects nonboolean option',async()=>{
  await withSite({},async root=>{
    await assert.rejects(auditStaticSite(root,{strictPublicHead:'true'}),/invalid strictPublicHead/);
  });
});

test('ignores forged canonical and meta description placed only in body or HTML comments',async()=>{
  const spoofed='<!doctype html><html lang="pt-BR"><head>'+
    '<!-- <title>Forged title</title><meta name="description" content="forged">'+
    '<link rel="canonical" href="'+origin+'/"><meta property="og:url" content="'+origin+'/"> -->'+
    '</head><body><title>Body title</title>'+
    '<meta name="description" content="Body description">'+
    '<link rel="canonical" href="'+origin+'/">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+origin+'/">'+
    '<h1>Title</h1></body></html>';
  await withSite({home:spoofed},async root=>{
    const result=await auditStaticSite(root,{strictPublicHead:true});
    for(const type of ['missing_title','missing_description','missing_canonical',
      'missing_robots_meta','missing_og_url']){
      assert.ok(result.errors.some(e=>e.type===type&&e.file==='index.html'),type);
    }
  });
});
test('rejects commented out canonical but accepts a visible real canonical in head',async()=>{
  const page=makePage('/',{links:['/servicos/']})
    .replace('<link rel="canonical" href="'+origin+'/">',
      '<!-- <link rel="canonical" href="'+origin+'/wrong/"> -->'+
      '<link rel="canonical" href="'+origin+'/">');
  await withSite({home:page},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.errors.filter(x=>x.file==='index.html').length,0);
  });
});
test('does not accept a canonical stored in the body when head lacks one',async()=>{
  const body=makePage('/').replace('<link rel="canonical" href="'+origin+'/">',
    '</head><body><link rel="canonical" href="'+origin+'/">');
  await withSite({home:body},async root=>{
    const report=await auditStaticSite(root);
    assert.ok(report.errors.some(x=>x.type==='missing_canonical'&&x.file==='index.html'));
  });
});

test('bounds directory traversal by depth, count and global entry budget',async()=>{
  await withSite({},async root=>{
    await assert.rejects(
      auditStaticSite(root,{crawlLimits:{maxDepth:0}}),
      /directory depth budget exceeded/);
    await assert.rejects(
      auditStaticSite(root,{crawlLimits:{maxDirectories:1}}),
      /directory count budget exceeded/);
    await assert.rejects(
      auditStaticSite(root,{crawlLimits:{maxEntries:3}}),
      /directory entry budget exceeded/);
  });
});
test('bounded crawler permits a healthy small build',async()=>{
  await withSite({},async root=>{
    const report=await auditStaticSite(root,{
      crawlLimits:{maxDirectories:2,maxEntries:6,maxDepth:1}
    });
    assert.deepEqual(report.summary,{pages:2,errors:0,warnings:0});
  });
});
test('refuses unsafe budgets and unknown settings',async()=>{
  await withSite({},async root=>{
    for(const budget of [{maxDepth:-1},{maxDirectories:5001},
      {maxEntries:1e20},{maxEntries:0},{unknownKey:true},null]){
      await assert.rejects(auditStaticSite(root,{crawlLimits:budget}),/invalid crawl budget/);
    }
  });
});

test('robots groups: does not mistake a non-Google crawler disallow for a sitewide block',async()=>{
  const robots='User-agent: BadBot\nDisallow: /\n\n'+
    'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n';
  await withSite({robots},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.errors.some(x=>x.type==='robots_block_all'),false);
    assert.equal(result.warnings.some(x=>x.type==='sitemap_not_in_robots'),false);
  });
});
test('robots Googlebot specific Allow overrides wildcard Disallow',async()=>{
  const robots='User-agent: *\nDisallow: /\n\n'+
    'User-agent: Googlebot\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n';
  await withSite({robots},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.errors.some(x=>x.type==='robots_block_all'),false);
  });
});
test('robots catches Googlebot-specific full root deny even if wildcard permits',async()=>{
  const robots='User-agent: *\nAllow: /\n\n'+
    'User-agent: Googlebot\nDisallow: / # root blocked\n'+
    'Sitemap: '+origin+'/sitemap.xml\n';
  await withSite({robots},async root=>{
    const result=await auditStaticSite(root);
    assert.ok(result.errors.some(x=>x.type==='robots_block_all'));
  });
});
test('robots cannot spoof sitemap declaration inside a comment or prose',async()=>{
  const robots='User-agent: *\nAllow: /\n'+
    '# Sitemap: '+origin+'/sitemap.xml\n'+
    'Comment: Sitemap: '+origin+'/sitemap.xml\n';
  await withSite({robots},async root=>{
    const result=await auditStaticSite(root);
    assert.ok(result.warnings.some(x=>x.type==='sitemap_not_in_robots'));
  });
});
test('robots recognizes a proper sitemap directive with whitespace and inline comment',async()=>{
  const robots='User-agent: *\nAllow: /\n'+
    'SITEMAP : '+origin+'/sitemap.xml # reviewed local fixture\n';
  await withSite({robots},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.warnings.some(x=>x.type==='sitemap_not_in_robots'),false);
  });
});

test('sitemap ignores fake loc URLs inside XML comments',async()=>{
  const sitemap='<urlset><!-- <loc>'+origin+'/</loc> -->'+
    '<loc>'+origin+'/servicos/</loc></urlset>';
  await withSite({sitemap},async root=>{
    const result=await auditStaticSite(root);
    assert.ok(result.warnings.some(x=>x.type==='page_not_in_sitemap'&&x.file==='index.html'));
    assert.equal(result.errors.some(x=>x.type==='invalid_sitemap_url'),false);
  });
});
test('sitemap refuses a URL fragment even when its base URL exists',async()=>{
  const sitemap='<urlset><loc>'+origin+'/#PRIVATE-ANCHOR</loc>'+
    '<loc>'+origin+'/servicos/</loc></urlset>';
  await withSite({sitemap},async root=>{
    const result=await auditStaticSite(root);
    assert.ok(result.errors.some(x=>x.type==='invalid_sitemap_url'));
    assert.doesNotMatch(JSON.stringify(result.errors),/PRIVATE-ANCHOR/);
  });
});
test('sitemap refuses XML without urlset or with a DTD',async()=>{
  for(const sitemap of [
    '<something><loc>'+origin+'/</loc><loc>'+origin+'/servicos/</loc></something>',
    '<!DOCTYPE urlset><urlset><loc>'+origin+'/</loc>'+
      '<loc>'+origin+'/servicos/</loc></urlset>'
  ]){
    await withSite({sitemap},async root=>{
      const result=await auditStaticSite(root);
      assert.ok(result.errors.some(x=>x.type==='invalid_sitemap_structure'));
    });
  }
});
test('sitemap with comments only is rejected as empty URL inventory',async()=>{
  const sitemap='<urlset><!-- <loc>'+origin+'/</loc> --></urlset>';
  await withSite({sitemap},async root=>{
    const result=await auditStaticSite(root);
    assert.ok(result.errors.some(x=>x.type==='missing_sitemap_urls'));
  });
});
test('sitemap exact public canonical accepts valid loc whitespace in XML',async()=>{
  const sitemap='<urlset><loc> '+origin+'/ </loc><loc>'+
    origin+'/servicos/</loc></urlset>';
  await withSite({sitemap},async root=>{
    const result=await auditStaticSite(root);
    assert.deepEqual(result.summary,{pages:2,errors:0,warnings:0});
  });
});

test('Googlebot-specific noindex is detected despite public robots index-follow',async()=>{
  const home=makePage('/',{links:['/servicos/']})
    .replace('</head>','<meta name="googlebot" content="noindex,follow"></head>');
  await withSite({home},async root=>{
    const report=await auditStaticSite(root);
    assert.ok(report.errors.some(e=>e.type==='googlebot_indexing_blocked'&&e.file==='index.html'));
  });
});
test('robots meta none is treated as noindex even without explicit noindex token',async()=>{
  const home=makePage('/',{links:['/servicos/']})
    .replace('content="index,follow"','content="none"');
  await withSite({home},async root=>{
    const report=await auditStaticSite(root);
    assert.ok(report.errors.some(e=>e.type==='unexpected_noindex'&&e.file==='index.html'));
  });
});
test('strict public head flags Googlebot nofollow and duplicate directives',async()=>{
  const home=makePage('/',{links:['/servicos/']})
    .replace('</head>','<meta name="googlebot" content="nofollow">'+
      '<meta name="googlebot" content="index,follow">'+
      '<meta property="og:url" content="'+origin+'/"></head>');
  const svc=makePage('/servicos/')
    .replace('</head>','<meta property="og:url" content="'+origin+'/servicos/"></head>');
  await withSite({home,service:svc},async root=>{
    const result=await auditStaticSite(root,{strictPublicHead:true});
    assert.ok(result.errors.some(e=>e.type==='googlebot_indexing_blocked'));
    assert.ok(result.errors.some(e=>e.type==='duplicate_googlebot_meta'));
  });
});
test('Googlebot benign directive does not change the public indexing gate',async()=>{
  const home=makePage('/',{links:['/servicos/']})
    .replace('</head>','<meta name="googlebot" content="index,follow"></head>');
  await withSite({home},async root=>{
    const report=await auditStaticSite(root);
    assert.deepEqual(report.summary,{pages:2,errors:0,warnings:0});
  });
});
