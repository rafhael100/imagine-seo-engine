import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
async function auditBody(body){
  const root=await mkdtemp(join(tmpdir(),'seo-heading-tokens-'));
  try{
    await writeFile(join(root,'index.html'),
      '<!doctype html><html lang="pt-BR"><head><title>Imagine serviços</title>'+
      '<meta name="description" content="Descrição sintética dos serviços Imagine">'+
      '<meta name="robots" content="index,follow">'+
      '<meta property="og:url" content="'+ORIGIN+'/">'+
      '<link rel="canonical" href="'+ORIGIN+'/">'+
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
      '</head><body>'+body+'</body></html>');
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),
      '<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead:true});
  }finally{await rm(root,{recursive:true,force:true});}
}

const CASES=[
  ['textarea text cannot satisfy a missing heading',
    '<textarea><h1>Literal example</h1></textarea>',0],
  ['textarea text cannot duplicate a real heading',
    '<h1>Actual heading</h1><textarea><h1>Literal example</h1></textarea>',1],
  ['raw xmp text cannot satisfy a missing heading',
    '<xmp><h1>Literal example</h1></xmp>',0],
  ['iframe fallback text cannot duplicate a real heading',
    '<h1>Actual heading</h1><iframe><h1>Literal example</h1></iframe>',1],
  ['quoted example cannot satisfy a missing heading',
    '<div data-example="<h1>Literal example</h1>">Example</div>',0],
  ['quoted example cannot duplicate a real heading',
    '<h1>Actual heading</h1><div data-example="<h1>Literal example</h1>">Example</div>',1],
  ['quoted greater-than and apparent tag stay within the real heading attribute',
    '<h1 data-example="> <h1>Literal example</h1>">Actual heading</h1>',1],
  ['two real headings retain their exact count alongside inert examples',
    '<textarea><h1>Literal example</h1></textarea><h1>First</h1><h1>Second</h1>',2],
  ['a page without headings is still rejected','<p>Plain content</p>',0],
  ['one actual heading still passes','<h1>Actual heading</h1>',1],
  ['two actual headings are still rejected','<h1>First</h1><h1>Second</h1>',2],
  ['case-insensitive actual heading remains supported','<H1 class="title">Actual heading</H1>',1],
  ['comments templates scripts and styles remain excluded',
    '<!-- <h1>Comment</h1> --><template><h1>Template</h1></template>'+
    '<script>const example="<h1>Script text</h1>";</script>'+
    '<style>.example::before{content:"<h1>Style text</h1>"}</style><h1>Actual heading</h1>',1],
  ['a real heading after a raw element remains visible',
    '<textarea>Example text</textarea><h1>Actual heading</h1>',1]
];

for(const [label,body,expectedCount] of CASES){
  test(label,async()=>{
    const report=await auditBody(body);
    const expected=expectedCount===1?[]:[{
      type:'heading_count',file:'index.html',
      message:'One H1 required; found '+expectedCount
    }];
    assert.deepEqual(report.errors,expected,'ASSERT_REAL_H1_COUNT: '+label);
    assert.deepEqual(report.warnings,[]);
  });
}
