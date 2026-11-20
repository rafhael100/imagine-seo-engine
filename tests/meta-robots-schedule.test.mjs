import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';
import {buildOfflineSeoBrief} from '../src/seo-brief.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
const FINDING='meta_robots_policy_review_required';
function page(extra=''){
  return '<!doctype html><html lang="pt-BR"><head>'+
    '<title>Imagine schedule fixture</title>'+
    '<meta name="description" content="Original descriptive page text.">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+ORIGIN+'/">'+
    '<link rel="canonical" href="'+ORIGIN+'/">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    extra+'</head><body><h1>Imagine schedule fixture</h1></body></html>';
}
async function audit(html,strictPublicHead=true){
  const root=await mkdtemp(join(tmpdir(),'seo-meta-schedule-'));
  try{
    await writeFile(join(root,'index.html'),html);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead});
  }finally{await rm(root,{recursive:true,force:true});}
}

test('healthy public metadata does not require schedule review',async()=>{
  assert.deepEqual((await audit(page())).summary,{pages:1,errors:0,warnings:0});
});

for(const [label,content] of [
  ['past','unavailable_after: 2000-01-01T00:00:00Z'],
  ['future','unavailable_after: 2999-01-01T00:00:00Z'],
  ['RFC date with comma','unavailable_after: Wed, 17 Nov 1999 12:00:00 GMT'],
  ['empty date','unavailable_after:'],
  ['mixed case and surrounding directives','index, UnAvAiLaBlE_AfTeR : 2999-01-01T00:00:00Z, follow']
]){
  test('Googlebot '+label+' schedule requires explicit review in both modes',async()=>{
    for(const strict of [false,true]){
      const report=await audit(page('<meta name="GoOgLeBoT" content="'+content+'">'),strict);
      assert.ok(report.errors.some(issue=>issue.type===FINDING));
      assert.ok(!report.errors.some(issue=>issue.type==='googlebot_indexing_blocked'));
    }
  });
}

test('generic robots schedule requires review even without the strict head contract',async()=>{
  const html=page().replace('content="index,follow"',
    'content="index,follow,unavailable_after: 2999-01-01T00:00:00Z"');
  for(const strict of [false,true]){
    assert.ok((await audit(html,strict)).errors.some(issue=>issue.type===FINDING));
  }
});

test('BODY schedules remain applicable without supplying the strict HEAD contract',async()=>{
  for(const name of ['robots','googlebot']){
    for(const strict of [false,true]){
      const html=page().replace('</body>','<meta name="'+name+'" '+
        'content="unavailable_after: 2000-01-01T00:00:00Z"></body>');
      assert.ok((await audit(html,strict)).errors.some(issue=>issue.type===FINDING));
    }
  }
});

test('max-image-preview none with whitespace restricts images, not page indexation',async()=>{
  for(const content of [
    'max-image-preview: none',
    'max-image-preview : none',
    'MAX-IMAGE-PREVIEW:\tnOnE',
    'max-snippet: 80, max-image-preview: none, max-video-preview: -1'
  ]){
    for(const location of ['head','body']){
      const html=page().replace('</'+location+'>',
        '<meta name="googlebot" content="'+content+'"></'+location+'>');
      assert.deepEqual((await audit(html)).summary,{pages:1,errors:0,warnings:0});
    }
  }
});

test('a preview parameter cannot consume separate noindex, none or nofollow rules',async()=>{
  for(const content of [
    'max-image-preview: none, noindex',
    'noindex, max-image-preview: none',
    'max-image-preview: none, none',
    'max-image-preview: none nofollow'
  ]){
    const report=await audit(page('<meta name="googlebot" content="'+content+'">'));
    assert.ok(report.errors.some(issue=>issue.type==='googlebot_indexing_blocked'));
  }
});

test('decoded HTML references cannot conceal a Googlebot schedule',async()=>{
  const report=await audit(page('<meta name="google&#98;ot" '+
    'content="unavailable&#95;after&#58; 2999-01-01T00:00:00Z">'));
  assert.ok(report.errors.some(issue=>issue.type===FINDING));
});

test('separate permissive meta cannot cancel a scheduled restriction',async()=>{
  const report=await audit(page('<meta name="googlebot" content="all">'+
    '<meta name="googlebot" content="unavailable_after: 2999-01-01T00:00:00Z">'),false);
  assert.ok(report.errors.some(issue=>issue.type===FINDING));
});

test('schedule finding produces a sanitized high-priority indexation review',async()=>{
  const report=await audit(page('<meta name="googlebot" '+
    'content="unavailable_after: PRIVATE_SCHEDULE_MARKER">'));
  const finding=report.errors.find(issue=>issue.type===FINDING);
  assert.ok(finding);
  assert.doesNotMatch(JSON.stringify(report.errors),/PRIVATE_SCHEDULE_MARKER/);
  const brief=buildOfflineSeoBrief({audit:report});
  assert.equal(brief.technical.status,'review_required');
  assert.deepEqual(brief.recommendedReviews,
    [{code:'review_indexation',priority:'high',count:1}]);
  assert.doesNotMatch(JSON.stringify(brief),/PRIVATE_SCHEDULE_MARKER|index\.html|imaginecomunicacao/);
});

for(const [label,extra] of [
  ['another crawler','<meta name="otherbot" content="unavailable_after: 2000-01-01T00:00:00Z">'],
  ['preview parameters','<meta name="googlebot" content="max-snippet:80,max-image-preview:none,max-video-preview:-1">'],
  ['description prose','<meta name="unused" content="Documentation: unavailable_after: 2000-01-01T00:00:00Z">'],
  ['comment','<!-- <meta name="googlebot" content="unavailable_after: 2000-01-01T00:00:00Z"> -->'],
  ['template','<template><meta name="googlebot" content="unavailable_after: 2000-01-01T00:00:00Z"></template>'],
  ['script','<script>const example = \'<meta name="googlebot" content="unavailable_after: 2000-01-01T00:00:00Z">\';</script>'],
  ['encoded text decoded only once','<meta name="googlebot" content="unavailable&amp;#95;after: 2000-01-01T00:00:00Z">']
]){
  test(label+' does not create a page schedule restriction',async()=>{
    const report=await audit(page(extra));
    assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
  });
}

test('apparent scheduled meta inside title RCDATA is inert',async()=>{
  const html=page().replace('Imagine schedule fixture</title>',
    'Example <meta name="googlebot" content="unavailable_after: 2000-01-01T00:00:00Z"></title>');
  assert.deepEqual((await audit(html)).summary,{pages:1,errors:0,warnings:0});
});
