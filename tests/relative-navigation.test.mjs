import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
function page(route,{links=[],body='',head=''}={}){
  return '<!doctype html><html lang="pt-BR"><head><title>Imagine '+route+'</title>'+
    '<meta name="description" content="Original descriptive text for '+route+'">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+ORIGIN+route+'">'+
    '<link rel="canonical" href="'+ORIGIN+route+'">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    head+'</head><body><h1>Imagine '+route+'</h1>'+body+
    links.map(href=>'<a href="'+href+'">Visit page</a>').join('')+'</body></html>';
}
async function audit(routes){
  const root=await mkdtemp(join(tmpdir(),'seo-relative-navigation-'));
  try{
    for(const [route,options] of Object.entries(routes)){
      const file=join(root,route.slice(1)+(route.endsWith('/')?'index.html':''));
      await mkdir(dirname(file),{recursive:true});
      await writeFile(file,page(route,options));
    }
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+Object.keys(routes)
      .map(route=>'<url><loc>'+ORIGIN+route+'</loc></url>').join('')+'</urlset>');
    return await auditStaticSite(root,{strictPublicHead:true});
  }finally{await rm(root,{recursive:true,force:true});}
}

test('relative missing child is not replaced by an existing root route',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{links:['contato/']},
    '/contato/':{links:['/']}
  });
  assert.ok(report.errors.some(issue=>issue.type==='broken_internal_link'&&
    issue.file==='servicos/index.html'));
});

test('the wrong root candidate remains orphaned and unreachable',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{links:['contato/']},
    '/contato/':{}
  });
  assert.ok(report.warnings.some(issue=>issue.type==='orphan_page'&&
    issue.file==='contato/index.html'));
  assert.ok(report.warnings.some(issue=>issue.type==='unreachable_page'&&
    issue.file==='contato/index.html'));
  assert.deepEqual(report.graph,{reachable:2,unreachable:1,maxClicks:1,orphanPages:1});
});

for(const href of ['contato/','./contato/']){
  test('valid nested child '+href+' supplies the correct navigation edge',async()=>{
    const report=await audit({
      '/':{links:['/servicos/']},
      '/servicos/':{links:[href]},
      '/servicos/contato/':{links:['/']}
    });
    assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0});
    assert.deepEqual(report.graph,{reachable:3,unreachable:0,maxClicks:2,orphanPages:0});
  });
}

test('parent traversal resolves from the source directory, not the origin root',async()=>{
  const report=await audit({
    '/':{links:['/guias/dicas/']},
    '/guias/dicas/':{links:['../contato/']},
    '/guias/contato/':{links:['/']}
  });
  assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0});
  assert.equal(report.graph.maxClicks,2);
});

test('an HTML filename uses its parent directory as the relative URL base',async()=>{
  const report=await audit({
    '/':{links:['/guias/artigo.html']},
    '/guias/artigo.html':{links:['contato.html']},
    '/guias/contato.html':{links:['/']}
  });
  assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0});
  assert.deepEqual(report.routes,['/','/guias/artigo.html','/guias/contato.html']);
});

test('local fragments and a fragment on a nested relative destination remain valid',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{body:'<section id="overview">Overview</section>',
      links:['#overview','contato/#details']},
    '/servicos/contato/':{body:'<section id="details">Contact details</section>',links:['/']}
  });
  assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0});
  assert.equal(report.graph.reachable,3);
});

test('a missing local fragment still produces the existing warning',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{links:['#missing']}
  });
  assert.ok(report.warnings.some(issue=>issue.type==='broken_local_fragment'&&
    issue.file==='servicos/index.html'));
});

test('root-relative and same-origin absolute links retain their existing behavior',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{links:['/contato/',ORIGIN+'/sobre/']},
    '/contato/':{links:['/']},
    '/sobre/':{links:['/']}
  });
  assert.deepEqual(report.summary,{pages:4,errors:0,warnings:0});
  assert.deepEqual(report.graph,{reachable:4,unreachable:0,maxClicks:2,orphanPages:0});
});

test('external absolute links are not treated as internal child routes',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{links:['https://external.example/contact/','//external.example/about/']}
  });
  assert.deepEqual(report.summary,{pages:2,errors:0,warnings:0});
  assert.equal(report.graph.reachable,2);
});

test('relative navigation cannot repair a wrong canonical in the source page',async()=>{
  const report=await audit({
    '/':{links:['/servicos/']},
    '/servicos/':{links:['contato/'],head:'<link rel="canonical" href="'+ORIGIN+'/contato/">'},
    '/servicos/contato/':{links:['/']}
  });
  assert.ok(report.errors.some(issue=>issue.type==='missing_canonical'&&
    issue.file==='servicos/index.html'));
});

for(const location of ['head','body']){
  test('an active BASE href in '+location+' prevents an unsupported navigation approval',async()=>{
    const report=await audit({
      '/':{links:['contato/'],[location]:'<base href="/moved/">'},
      '/contato/':{links:['/']}
    });
    assert.ok(report.errors.some(issue=>issue.type==='unsupported_base_href'));
  });
}

for(const [label,markup] of [
  ['empty href','<base href="">'],
  ['bare href','<base href>'],
  ['duplicate href','<base href="/" href="/moved/">'],
  ['unquoted mixed-case href','<BASE HREF=/moved/>'],
  ['malformed href value','<base href=>']
]){
  test('BASE '+label+' requires explicit review without inferring document.baseURI',async()=>{
    const report=await audit({'/':{head:markup}});
    assert.ok(report.errors.some(issue=>issue.type==='unsupported_base_href'));
  });
}

for(const [label,options] of [
  ['target only',{head:'<base target="_blank">'}],
  ['href text inside a non-href attribute',{head:'<base target="_blank" data-example="href=\'/moved/\'">'}],
  ['comment',{head:'<!-- <base href="/moved/"> -->'}],
  ['template',{head:'<template><base href="/moved/"></template>'}],
  ['script',{head:'<script>const example = \'<base href="/moved/">\';</script>'}],
  ['title RCDATA',{head:'<title>Example <base href="/moved/"></title>'}],
  ['textarea RCDATA',{body:'<textarea>Example <base href="/moved/"></textarea>'}],
  ['quoted attribute',{head:'<meta name="unused" content="Example <base href=\'/moved/\'>">'}]
]){
  test('BASE '+label+' does not alter the document navigation base',async()=>{
    const report=await audit({'/':options});
    assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
  });
}

test('unsupported BASE produces a sanitized high-priority metadata review',async()=>{
  const report=await audit({'/':{head:'<base href="https://private.example/PRIVATE_BASE_MARKER/">'}});
  assert.ok(report.errors.some(issue=>issue.type==='unsupported_base_href'));
  assert.doesNotMatch(JSON.stringify(report.errors),/private\.example|PRIVATE_BASE_MARKER/);
  const brief=buildOfflineSeoBrief({audit:report});
  assert.equal(brief.technical.status,'review_required');
  assert.deepEqual(brief.recommendedReviews,
    [{code:'review_page_metadata',priority:'high',count:1}]);
  assert.doesNotMatch(JSON.stringify(brief),/private\.example|PRIVATE_BASE_MARKER|index\.html/);
});
