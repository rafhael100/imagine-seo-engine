import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
const DESCRIPTION='<meta name="description" content="Original body robots fixture.">';
const ROBOTS='<meta name="robots" content="index,follow">';
const OG='<meta property="og:url" content="'+ORIGIN+'/">';
const CANONICAL='<link rel="canonical" href="'+ORIGIN+'/">';
function page(){
  return '<!doctype html><html lang="pt-BR"><head>'+
    '<title>Imagine body robots fixture</title>'+DESCRIPTION+ROBOTS+OG+CANONICAL+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine body robots fixture</h1></body></html>';
}
function withBody(markup){return page().replace('</body>',markup+'</body>');}
async function audit(html,strictPublicHead=true){
  const root=await mkdtemp(join(tmpdir(),'seo-f209-'));
  try{
    await writeFile(join(root,'index.html'),html);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead});
  }finally{await rm(root,{recursive:true,force:true});}
}

for(const name of ['robots','googlebot']){
  for(const content of ['noindex','none','nofollow']){
    test('F209 BODY '+name+' '+content+' blocks the public audit',async()=>{
      for(const strict of [false,true]){
        const report=await audit(withBody('<meta name='+name+' content='+content+'>'),strict);
        const expected=name==='googlebot'?'googlebot_indexing_blocked':
          content==='nofollow'?'unexpected_nofollow':'unexpected_noindex';
        assert.ok(report.errors.some(issue=>issue.type===expected));
      }
    });
  }
}

test('F209 BODY index/follow does not remove a HEAD noindex restriction',async()=>{
  const html=withBody(ROBOTS).replace(ROBOTS,'<meta name="robots" content="noindex">');
  const report=await audit(html,false);
  assert.ok(report.errors.some(issue=>issue.type==='unexpected_noindex'));
});

test('F209 BODY encoded Googlebot restriction is decoded once',async()=>{
  const report=await audit(withBody('<meta name="google&#98;ot" content="no&#x69;ndex">'));
  assert.ok(report.errors.some(issue=>issue.type==='googlebot_indexing_blocked'));
});

for(const [label,markup] of [
  ['duplicate restrictive-first content','<meta name="robots" content="noindex" content="index,follow">'],
  ['duplicate permissive-first content','<meta name="robots" content="index,follow" content="noindex">'],
  ['duplicate name','<meta name="googlebot" name="BODY_PRIVATE_MARKER" content="noindex">'],
  ['unsupported name encoding','<meta name="google&#98ot" content="noindex">'],
  ['unsupported content encoding','<meta name="robots" content="no&#105ndex">']
]){
  test('F209 BODY '+label+' requires explicit indexing review',async()=>{
    const report=await audit(withBody(markup));
    assert.ok(report.errors.some(issue=>issue.type==='ambiguous_body_robots_meta'));
    assert.doesNotMatch(JSON.stringify(report.errors),/BODY_PRIVATE_MARKER|&#/);
  });
}

test('F209 BODY private editorial marker blocks a public build',async()=>{
  const report=await audit(withBody(
    '<meta name="imagine:editorial-preview" content="private-unpublished-review">'));
  assert.ok(report.errors.some(issue=>issue.type==='private_editorial_preview_in_public_build'));
});

test('F209 BODY ambiguity becomes a high-priority sanitized indexing review',async()=>{
  const report=await audit(withBody(
    '<meta name="googlebot" name="BODY_PRIVATE_MARKER" content="noindex">'));
  const brief=buildOfflineSeoBrief({audit:report});
  assert.equal(brief.recommendedReviews.find(item=>item.code==='review_indexation')?.priority,'high');
  assert.doesNotMatch(JSON.stringify(brief),/BODY_PRIVATE_MARKER|index\.html|imaginecomunicacao/);
});

for(const [label,markup] of [
  ['script','<script>const example = "<meta name=googlebot content=noindex>";</script>'],
  ['style','<style>.example::before { content: "<meta name=googlebot content=noindex>"; }</style>'],
  ['template','<template><meta name=googlebot content=noindex></template>'],
  ['comment','<!-- <meta name=googlebot content=noindex> -->'],
  ['textarea','<textarea><meta name=googlebot content=noindex></textarea>'],
  ['quoted attribute',"<div data-example=\"<meta name='googlebot' content='noindex'>\">Example</div>"]
]){
  test('F209 apparent BODY meta in '+label+' is inert',async()=>{
    const report=await audit(withBody(markup));
    assert.equal(report.summary.errors,0);
  });
}

test('F209 healthy BODY directives keep the required HEAD evidence accepted',async()=>{
  const report=await audit(withBody(ROBOTS+'<meta name="googlebot" content="index,follow">'));
  assert.equal(report.summary.errors,0);
});

test('F209 BODY metadata cannot satisfy required HEAD evidence',async()=>{
  let html=page();
  for(const markup of [DESCRIPTION,ROBOTS,OG,CANONICAL])html=html.replace(markup,'');
  html=html.replace('</body>',DESCRIPTION+ROBOTS+OG+CANONICAL+'</body>');
  const report=await audit(html);
  for(const expected of ['missing_description','missing_robots_meta','missing_og_url','missing_canonical'])
    assert.ok(report.errors.some(issue=>issue.type===expected));
});

test('F209 unrelated BODY metadata does not change HEAD metadata results',async()=>{
  const report=await audit(withBody(
    '<meta name="description" content="Body only" content="Another value">'+
    '<link rel="canonical" href="https://elsewhere.invalid/">'));
  assert.equal(report.summary.errors,0);
});
