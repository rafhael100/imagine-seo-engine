import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
const SITEMAP='Sitemap: '+ORIGIN+'/sitemap.xml\n';
function page(path){
  return '<!doctype html><html lang="pt-BR"><head><title>Robots fixture '+path+'</title>'+
    '<meta name="description" content="Original synthetic page for robots group '+path+'">'+
    '<meta name="robots" content="index,follow"><link rel="canonical" href="'+ORIGIN+path+'">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Original fixture</h1>'+
    (path==='/'?'<a href="/servicos/">Services</a>':'')+'</body></html>';
}
async function review(robots){
  const root=await mkdtemp(join(tmpdir(),'imagine-robots-agent-'));
  try {
    await mkdir(join(root,'servicos'));
    await writeFile(join(root,'index.html'),page('/'));
    await writeFile(join(root,'servicos/index.html'),page('/servicos/'));
    await writeFile(join(root,'robots.txt'),robots+SITEMAP);
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+
      '/</loc></url><url><loc>'+ORIGIN+'/servicos/</loc></url></urlset>');
    return await auditStaticSite(root);
  } finally {await rm(root,{recursive:true,force:true});}
}
function blockedFiles(report){
  return report.errors.filter(issue=>issue.type==='robots_block_public_page').map(issue=>issue.file);
}

for(const agent of ['Googlebot/2.1','Googlebot*']){
  test('robots recognizes '+agent+' as the general crawler for path denial',async()=>{
    const result=await review('User-agent: *\nAllow: /\n\nUser-agent: '+agent+'\nDisallow: /servicos/\n');
    assert.deepEqual(blockedFiles(result),['servicos/index.html']);
    assert.equal(result.errors.some(issue=>issue.type==='robots_block_all'),false);
  });
  test('robots recognizes '+agent+' for root denial over wildcard allow',async()=>{
    const result=await review('User-agent: *\nAllow: /\n\nUser-agent: '+agent+'\nDisallow: /\n');
    assert.ok(result.errors.some(issue=>issue.type==='robots_block_all'));
  });
  test('robots specific '+agent+' allow supersedes wildcard denial',async()=>{
    const result=await review('User-agent: *\nDisallow: /\n\nUser-agent: '+agent+'\nAllow: /\n');
    assert.deepEqual(result.summary,{pages:2,errors:0,warnings:0});
  });
}

test('robots combines exact and versioned general-crawler groups',async()=>{
  const result=await review('User-agent: Googlebot\nAllow: /\n\n'+
    'User-agent: Googlebot/2.1\nDisallow: /servicos/\n');
  assert.deepEqual(blockedFiles(result),['servicos/index.html']);
});

test('robots merges a suffixed group Allow into an exact-group Disallow tie',async()=>{
  const result=await review('User-agent: Googlebot\nDisallow: /servicos/\n\n'+
    'User-agent: Googlebot*\nAllow: /servicos/\n');
  assert.deepEqual(result.summary,{pages:2,errors:0,warnings:0});
});

test('robots recognizes a general-crawler token in a shared user-agent group',async()=>{
  const result=await review('User-agent: *\nAllow: /\n\n'+
    'User-agent: Otherbot\nUser-agent: gOoGlEbOt/2.1\nDisallow: /servicos/\n');
  assert.deepEqual(blockedFiles(result),['servicos/index.html']);
});

test('robots keeps manual review for complex paths in a suffixed general-crawler group',async()=>{
  const result=await review('User-agent: *\nAllow: /\n\nUser-agent: Googlebot/2.1\n'+
    'Disallow: /servicos/\nAllow: /servicos/*\n');
  assert.deepEqual(blockedFiles(result),[]);
  assert.ok(result.warnings.some(issue=>issue.type==='robots_pattern_manual_review'));
});

for(const agent of ['Googlebot-Image','Googlebot-News/2.1','Googlebot-Image*','Googlebot_Extra','OtherGooglebot']){
  test('robots does not apply '+agent+' to the general web crawler',async()=>{
    const result=await review('User-agent: *\nAllow: /\n\nUser-agent: '+agent+'\nDisallow: /\n');
    assert.deepEqual(result.summary,{pages:2,errors:0,warnings:0});
  });
}
