import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
const RAW=['textarea','xmp','iframe','noembed','noframes','title'];
function page(route,body){
  return '<!doctype html><html lang="pt-BR"><head><title>Imagine '+route+'</title>'+
    '<meta name="description" content="Original descriptive text for '+route+'">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+ORIGIN+route+'">'+
    '<link rel="canonical" href="'+ORIGIN+route+'">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine '+route+'</h1>'+body+'</body></html>';
}
async function audit(routes){
  const root=await mkdtemp(join(tmpdir(),'seo-inert-navigation-'));
  try{
    for(const [route,body] of Object.entries(routes)){
      const file=join(root,route.slice(1)+'index.html');
      await mkdir(dirname(file),{recursive:true});
      await writeFile(file,page(route,body));
    }
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+Object.keys(routes)
      .map(route=>'<url><loc>'+ORIGIN+route+'</loc></url>').join('')+'</urlset>');
    return await auditStaticSite(root,{strictPublicHead:true});
  }finally{await rm(root,{recursive:true,force:true});}
}
function assertOrphan(report){
  assert.equal(report.summary.errors,0);
  assert.ok(report.warnings.some(issue=>issue.type==='orphan_page'&&
    issue.file==='contact/index.html'));
  assert.ok(report.warnings.some(issue=>issue.type==='unreachable_page'&&
    issue.file==='contact/index.html'));
  assert.deepEqual(report.graph,{reachable:1,unreachable:1,maxClicks:0,orphanPages:1});
}

for(const tag of RAW){
  test('apparent anchor inside '+tag+' does not connect an orphan page',async()=>{
    const report=await audit({
      '/':'<'+tag+'><a href="/contact/">Contact</a></'+tag+'>',
      '/contact/':'<a href="/">Home</a>'
    });
    assertOrphan(report);
  });

  test('apparent ID inside '+tag+' does not satisfy a real fragment link',async()=>{
    const report=await audit({
      '/':'<'+tag+'><span id="target">Example</span></'+tag+'><a href="#target">Target</a>'
    });
    assert.ok(report.warnings.some(issue=>issue.type==='broken_local_fragment'));
  });

  test('an ID on the actual '+tag+' opening tag remains a valid fragment target',async()=>{
    const report=await audit({
      '/':'<'+tag+' id="target">Example text</'+tag+'><a href="#target">Target</a>'
    });
    assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
  });
}

for(const [label,body] of [
  ['div attribute','<div data-example="<a href=\'/contact/\'>">Example</div>'],
  ['real anchor attribute','<a data-example="<a href=\'/contact/\'>">Example</a>']
]){
  test('apparent anchor in '+label+' does not create a navigation edge',async()=>{
    assertOrphan(await audit({'/':body,'/contact/':'<a href="/">Home</a>'}));
  });
}

test('apparent ID inside a quoted BODY attribute cannot satisfy a fragment',async()=>{
  const report=await audit({'/':'<div data-example="<span id=\'target\'>">Example</div>'+
    '<a href="#target">Target</a>'});
  assert.ok(report.warnings.some(issue=>issue.type==='broken_local_fragment'));
});

test('real links and IDs after raw text and quoted apparent markup remain visible',async()=>{
  const report=await audit({
    '/':'<textarea><a href="/missing/">Example</a><span id="target">Example</span></textarea>'+
      '<div data-example="<a href=\'/other-missing/\'>">Example</div>'+
      '<section id="target">Actual target</section><a href="#target">Target</a>'+
      '<a href="contact/">Contact</a>',
    '/contact/':'<a href="/">Home</a>'
  });
  assert.deepEqual(report.summary,{pages:2,errors:0,warnings:0});
  assert.deepEqual(report.graph,{reachable:2,unreachable:0,maxClicks:1,orphanPages:0});
});

test('an ID only appearing in raw text does not create a duplicate of a real ID',async()=>{
  const report=await audit({'/':'<textarea><span id="target">Example</span></textarea>'+
    '<section id="target">Actual target</section><a href="#target">Target</a>'});
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});

test('duplicate actual IDs retain the existing warning',async()=>{
  const report=await audit({'/':'<textarea id="target">Text</textarea>'+
    '<section id="target">Actual duplicate</section><a href="#target">Target</a>'});
  assert.ok(report.warnings.some(issue=>issue.type==='duplicate_html_id'));
});

test('apparent unsafe href inside raw text is not a live navigation action',async()=>{
  const report=await audit({'/':'<textarea><a href="javascript:alert(1)">Example</a></textarea>'});
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});

test('inert anchor examples do not consume the real per-page anchor budget',async()=>{
  const report=await audit({'/':'<textarea>'+
    '<a href="/">Example</a>'.repeat(1001)+'</textarea>'});
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});

test('the real per-page anchor budget still stops an oversized navigation list',async()=>{
  await assert.rejects(audit({'/':'<a href="/">Home</a>'.repeat(1001)}),
    /page anchor budget exceeded/);
});

test('the shared lexer token budget still rejects an oversized actual tag stream',async()=>{
  await assert.rejects(audit({'/':'<span></span>'.repeat(25001)}),
    /HTML token budget exceeded/);
});
