import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
function page(){
  return '<!doctype html><html lang="pt-BR"><head>'+
    '<title>Imagine SEO fixture</title>'+
    '<meta name="description" content="Original descriptive page text.">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+ORIGIN+'/">'+
    '<link rel="canonical" href="'+ORIGIN+'/">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine SEO fixture</h1></body></html>';
}
async function audit(html,strictPublicHead=true){
  const root=await mkdtemp(join(tmpdir(),'seo-f205-'));
  try{
    await writeFile(join(root,'index.html'),html);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead});
  }finally{await rm(root,{recursive:true,force:true});}
}
test('F205 known healthy strict head remains accepted',async()=>{
  const report=await audit(page());
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});
for(const content of [
  'content="noindex" content="index,follow"',
  'content="index,follow" content="noindex"'
]){
  test('F205 rejects duplicate robots content in either order: '+content,async()=>{
    for(const strict of [false,true]){
      const report=await audit(page().replace('content="index,follow"',content),strict);
      assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
    }
  });
}
test('F205 duplicate meta name cannot hide Googlebot noindex',async()=>{
  const report=await audit(page().replace('</head>',
    '<meta name="googlebot" name="other" content="noindex"></head>'));
  assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
});
test('F205 duplicate canonical href cannot replace the effective wrong target',async()=>{
  const report=await audit(page().replace(
    'rel="canonical" href="'+ORIGIN+'/"',
    'rel="canonical" href="https://wrong.invalid/private" href="'+ORIGIN+'/"'));
  assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
  assert.doesNotMatch(JSON.stringify(report.errors),/wrong\.invalid|\/private/);
});
test('F205 valid unquoted public metadata remains accepted',async()=>{
  const html=page().replace('name="robots" content="index,follow"','name=robots content=index,follow')
    .replace('rel="canonical"','rel=canonical');
  const report=await audit(html);
  assert.equal(report.summary.errors,0);
});
test('F205 unquoted Googlebot noindex is effective metadata',async()=>{
  const report=await audit(page().replace('</head>',
    '<meta name=googlebot content=noindex></head>'));
  assert.ok(report.errors.some(x=>x.type==='googlebot_indexing_blocked'));
});
test('F205 numeric character references cannot conceal Googlebot noindex',async()=>{
  const report=await audit(page().replace('</head>',
    '<meta name="google&#98;ot" content="no&#x69;ndex"></head>'));
  assert.ok(report.errors.some(x=>x.type==='googlebot_indexing_blocked'));
});
test('F205 unsupported character-reference syntax fails explicitly',async()=>{
  const report=await audit(page().replace('</head>',
    '<meta name="google&#98ot" content="noindex"></head>'));
  assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
});
test('F205 quoted editorial text containing greater-than and apparent attributes is not markup',async()=>{
  const html=page().replace('Original descriptive page text.',
    "A > B; name='googlebot' content='noindex'; <meta name='robots' content='none'> as quoted prose.");
  const report=await audit(html);
  assert.equal(report.summary.errors,0);
});
