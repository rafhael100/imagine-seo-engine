import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';

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

for(const rel of [
  'rel="canonical" rel="stylesheet"',
  'rel="stylesheet" rel="canonical"'
]){
  test('F205 duplicate canonical relation is ambiguous in either order: '+rel,async()=>{
    const report=await audit(page().replace('rel="canonical"',rel));
    assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
  });
}
test('F205 character references are decoded only once',async()=>{
  const report=await audit(page().replace('</head>',
    '<meta name="googlebot" content="no&amp;#x69;ndex"></head>'));
  assert.equal(report.summary.errors,0);
});
test('F205 apparent meta inside title RCDATA is only title text',async()=>{
  const report=await audit(page().replace('Imagine SEO fixture</title>',
    'Example <meta name=googlebot content=noindex></title>'));
  assert.equal(report.summary.errors,0);
});
test('F205 glued critical attributes fail explicitly',async()=>{
  const report=await audit(page().replace(
    'name="robots" content="index,follow"',
    'name="robots"content="index,follow"'));
  assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
});
test('F205 excessive per-tag attributes fail without unbounded evidence',async()=>{
  const extras=Array.from({length:129},(_,i)=>' data-test-'+i).join('');
  const report=await audit(page().replace('name="robots"','name="robots"'+extras));
  assert.ok(report.errors.some(x=>x.type==='ambiguous_head_metadata'));
});
test('F205 ambiguous metadata becomes a high-priority sanitized review in the brief',async()=>{
  const report=await audit(page().replace('</head>',
    '<meta name="googlebot" name="PRIVATE_MARKER" content="noindex"></head>'));
  const brief=buildOfflineSeoBrief({audit:report});
  const review=brief.recommendedReviews.find(x=>x.code==='review_page_metadata');
  assert.equal(review?.priority,'high');
  assert.doesNotMatch(JSON.stringify(brief),/PRIVATE_MARKER|index\.html|imaginecomunicacao/);
});

for(const [label,open,close] of [
  ['comment','<!--','-->'],
  ['template','<template>','</template>'],
  ['script','<script>','</script>'],
  ['style','<style>','</style>']
]){
  test('F205 quoted '+label+' markers cannot erase an active Googlebot restriction',async()=>{
    const replacement='<meta name="description" content="Original '+open+' literal">'+
      '<meta name="googlebot" content="noindex">'+
      '<meta name="unused" content="literal '+close+'">';
    const html=page().replace(
      '<meta name="description" content="Original descriptive page text.">',replacement);
    const report=await audit(html);
    assert.ok(report.errors.some(x=>x.type==='googlebot_indexing_blocked'));
  });
}

test('F205 script text cannot close a real inert template early',async()=>{
  const html=page().replace('</head>',
    '<template><script>const closing = "</template>";</script>'+
    '<meta name="googlebot" content="noindex"></template></head>');
  const report=await audit(html);
  assert.equal(report.summary.errors,0);
});
test('F205 comment markers inside script text cannot erase later active metadata',async()=>{
  const html=page().replace('</head>',
    '<script>const opening = "<!--";</script>'+
    '<meta name="googlebot" content="noindex">'+
    '<meta name="unused" content="literal -->"></head>');
  const report=await audit(html);
  assert.ok(report.errors.some(x=>x.type==='googlebot_indexing_blocked'));
});
test('F205 template markers in title text cannot erase later active metadata',async()=>{
  const html=page().replace('Imagine SEO fixture</title>',
    'Example <template> literal</title>').replace('</head>',
    '<meta name="googlebot" content="noindex">'+
    '<meta name="unused" content="literal </template>"></head>');
  const report=await audit(html);
  assert.ok(report.errors.some(x=>x.type==='googlebot_indexing_blocked'));
});
