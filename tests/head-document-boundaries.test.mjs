import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
function page(){
  return '<!doctype html><html lang="pt-BR"><head>'+
    '<title>Imagine document boundary fixture</title>'+
    '<meta name="description" content="Original descriptive page text.">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+ORIGIN+'/">'+
    '<link rel="canonical" href="'+ORIGIN+'/">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine document boundary fixture</h1></body></html>';
}
async function audit(html){
  const root=await mkdtemp(join(tmpdir(),'seo-f206-'));
  try{
    await writeFile(join(root,'index.html'),html);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead:true});
  }finally{await rm(root,{recursive:true,force:true});}
}

test('F206 healthy explicit document sections remain accepted',async()=>{
  const report=await audit(page());
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});

for(const [label,markup] of [
  ['JSON-LD','<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","description":"Documentation mentions </head> literally."}</script>'],
  ['script','<script>const example = "</head>";</script>'],
  ['style','<style>.example::before { content: "</head>"; }</style>']
]){
  test('F206 literal head closing in '+label+' cannot conceal active noindex',async()=>{
    const html=page().replace('</head>',markup+
      '<meta name="googlebot" content="noindex"></head>');
    const report=await audit(html);
    assert.ok(report.errors.some(issue=>issue.type==='googlebot_indexing_blocked'));
  });
}

test('F206 quoted head closing text does not truncate healthy metadata',async()=>{
  const html=page().replace('Original descriptive page text.',
    'Documentation mentions </head> as literal text.');
  const report=await audit(html);
  assert.equal(report.summary.errors,0);
});

test('F206 title RCDATA containing head closing text stays a complete title',async()=>{
  const html=page().replace('Imagine document boundary fixture</title>',
    'Document example </head> explained</title>');
  const report=await audit(html);
  assert.equal(report.summary.errors,0);
});

for(const [label,markup] of [
  ['script','<script>const example = "</body>";</script>'],
  ['quoted attribute','<div data-example="</body>">Example</div>'],
  ['textarea RCDATA','<textarea>Example </body> text</textarea>']
]){
  test('F206 literal body closing in '+label+' cannot conceal a broken link',async()=>{
    const html=page().replace('</body>',markup+
      '<a href="/missing-page/">Missing destination</a></body>');
    const report=await audit(html);
    assert.ok(report.errors.some(issue=>issue.type==='broken_internal_link'));
  });
}

test('F206 inert document markers cannot replace the real document sections',async()=>{
  const html=page().replace('<head>',
    '<!-- <head><meta name="googlebot" content="noindex"></head> -->'+
    '<head><template><head><meta name="googlebot" content="noindex"></head></template>')
    .replace('</body>',
      '<script>const example = "<head><meta name=googlebot content=noindex></head>";</script></body>');
  const report=await audit(html);
  assert.equal(report.summary.errors,0);
});
