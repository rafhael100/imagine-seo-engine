import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {reviewMunicipalHreflangCompleteness as review} from '../src/geo-hreflang-completeness.mjs';

const origin='https://imaginecomunicacao.com.br/';
const paths={
  'pt-BR':'/servicos/site-onepage/fortaleza-ce/',
  'en-US':'/en/sites/onepage/fortaleza/',
  'es-ES':'/es/sitios/onepage/fortaleza/'
};
const tags={'pt-BR':'pt-BR','en-US':'en','es-ES':'es'};
const entries=Object.keys(paths).map((locale,i)=>({
  serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',locale,
  canonicalPath:paths[locale],
  contentSha256:createHash('sha256').update('text-'+locale+'-'+i).digest('hex')
}));
const inventory=rows=>({sourceType:'operator_local_inventory_unverified',entries:rows});
function altTags(){
  return Object.entries(paths).map(([locale,path])=>
    '<link rel="alternate" hreflang="'+tags[locale]+'" href="'+new URL(path,origin).href+'">'
  ).join('');
}
function html(path,lang,extra,body='Sample genuine content'){
  const url=new URL(path,origin).href;
  return '<!doctype html><html lang="'+lang+'"><head>'+
    '<meta charset="utf-8"><title>Imagine locale '+lang+' '+path+'</title>'+
    '<meta name="description" content="Local service '+lang+' '+path+' independently written.">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+url+'">'+
    '<link rel="canonical" href="'+url+'">'+extra+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine services '+lang+'</h1><p>'+body+'</p></body></html>';
}
async function withBuild(run,mode='complete'){
  const root=await mkdtemp(join(tmpdir(),'seo-f124-'));
  try{
    await writeFile(join(root,'index.html'),html('/','pt-BR','',Object.values(paths)
      .map(path=>'<a href="'+path+'">See service</a>').join('')));
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+
      ['/',...Object.values(paths)].map(path=>
        '<url><loc>'+new URL(path,origin).href+'</loc></url>').join('')+'</urlset>');
    for(const [locale,path] of Object.entries(paths)){
      const folder=join(root,...path.split('/').filter(Boolean));
      await mkdir(folder,{recursive:true});
      let alternate=mode==='missing'?'':altTags();
      if(locale==='pt-BR'&&mode==='wrong-target')
        alternate=alternate.replace(
          'hreflang="en" href="'+new URL(paths['en-US'],origin).href+'"',
          'hreflang="en" href="'+new URL(paths['es-ES'],origin).href+'"'
        );
      if(locale==='pt-BR'&&mode==='double-alias')
        alternate+='<link rel="alternate" hreflang="en-US" href="'+
          new URL(paths['en-US'],origin).href+'">';
      await writeFile(join(folder,'index.html'),html(path,tags[locale],alternate));
    }
    await run({inventoryInput:inventory(entries),buildDirectory:root,siteUrl:origin});
  }finally{await rm(root,{recursive:true,force:true});}
}
test('F124 proves all nine actual hreflang pointers in a complete local triad',async()=>{
  await withBuild(async input=>{
    const out=await review(input);
    assert.equal(out.reviewStatus,'human_independent_review_required');
    assert.equal(out.summary.requiredHreflangLinks,9);
    assert.equal(out.summary.actuallyInspectedLinks,9);
    assert.equal(out.summary.missingHreflangLinks,0);
    assert.equal(out.summary.wrongHreflangTargets,0);
    assert.equal(out.summary.ambiguousAliases,0);
    assert.equal(out.summary.technicalErrors,0);
    assert.deepEqual(out.findings,[]);
    for(const k of ['officialSourceVerified','realTranslationQualityVerified',
      'publicDeploymentVerified','indexingAuthorized',
      'publicationAuthorized','customerDisplayAuthorized','networkPerformed'])
      assert.equal(out[k],false,k);
    assert.doesNotMatch(JSON.stringify(out),
      /fortaleza-ce|2304400|site-onepage|imaginecomunicacao.com.br/);
  });
});
test('F124 rejects no hreflang even when prior auditor saw no malformed links',async()=>{
  await withBuild(async input=>{
    const out=await review(input);
    assert.equal(out.reviewStatus,'blocked');
    assert.equal(out.summary.missingHreflangLinks,9);
    assert.equal(out.summary.technicalErrors,0);
    assert.deepEqual(out.findings[0],{
      firstInventoryIndex:0,sourceLocale:'pt-BR',
      targetLocale:'pt-BR',code:'missing_hreflang'
    });
  },'missing');
});
test('F124 rejects links to wrong translated canonical path',async()=>{
  await withBuild(async input=>{
    const out=await review(input);
    assert.equal(out.reviewStatus,'blocked');
    assert.equal(out.summary.wrongHreflangTargets,1);
  },'wrong-target');
});
test('F124 rejects ambiguous aliases EN and EN-US simultaneously',async()=>{
  await withBuild(async input=>{
    const out=await review(input);
    assert.equal(out.reviewStatus,'blocked');
    assert.equal(out.summary.ambiguousAliases,1);
  },'double-alias');
});
test('F124 refuses partial inventory and extra publication authority fields',async()=>{
  await withBuild(async input=>{
    const partial=await review({...input,inventoryInput:inventory(entries.slice(0,1))});
    assert.equal(partial.reviewStatus,'blocked');
    assert.equal(partial.summary.incompleteLocaleGroups,1);
    assert.equal(partial.summary.requiredHreflangLinks,0);
    await assert.rejects(review({...input,grantPublication:true}),/SEO F124/);
    await assert.rejects(review({...input,inventoryInput:inventory([
      {...entries[0],rawLeadEmail:'secret'}
    ])}),/SEO F108/);
  });
});
