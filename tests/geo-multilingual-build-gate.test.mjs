import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewMunicipalMultilingualBuild as review} from '../src/geo-multilingual-build-gate.mjs';

const siteUrl='https://imaginecomunicacao.com.br/';
const paths={
  'pt-BR':'/servicos/site-onepage/fortaleza-ce/',
  'en-US':'/en/sites/onepage/fortaleza/',
  'es-ES':'/es/sitios/onepage/fortaleza/'
};
const locales={'pt-BR':'pt-BR','en-US':'en','es-ES':'es'};
const hash=s=>createHash('sha256').update(s).digest('hex');
const manifest=enabled=>({
  sourceType:'operator_local_inventory_unverified',
  entries:enabled.map(locale=>({
    serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
    locale,canonicalPath:paths[locale],
    contentSha256:hash('original editorial text '+locale)
  }))
});
function html(path,lang,body,extra=''){
  const url=new URL(path,siteUrl).href;
  return '<!doctype html><html lang="'+lang+'"><head>'+
    '<meta charset="utf-8"><title>Imagine multilingual editorial '+lang+' '+path+'</title>'+
    '<meta name="description" content="Service guide '+lang+' '+path+' written for review.">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+url+'">'+
    '<link rel="canonical" href="'+url+'">'+extra+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine marketing service '+lang+'</h1>'+
    body+'</body></html>';
}
async function site(run){
  const root=await mkdtemp(join(tmpdir(),'seo-f123-'));
  try{
    const all=Object.values(paths);
    await writeFile(join(root,'index.html'),
      html('/','pt-BR',all.map(p=>'<a href="'+p+'">See service</a>').join('')));
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+siteUrl+'sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),
      '<urlset>'+['/',...all].map(p=>'<url><loc>'+new URL(p,siteUrl).href+
      '</loc></url>').join('')+'</urlset>');
    for(const [locale,path] of Object.entries(paths)){
      const folder=join(root,...path.split('/').filter(Boolean));
      await mkdir(folder,{recursive:true});
      await writeFile(join(folder,'index.html'),
        html(path,locales[locale],'<p>Unique local editorial content '+locale+'</p>'));
    }
    await run({
      root,
      input:{inventoryInput:manifest(Object.keys(paths)),buildDirectory:root,siteUrl}
    });
  }finally{await rm(root,{recursive:true,force:true});}
}
test('F123 accepts only independent HUMAN review after 3-language real HTML audit',async()=>{
  await site(async({input})=>{
    const output=await review(input);
    assert.equal(output.reviewStatus,'human_independent_review_required');
    assert.equal(output.summary.incompleteLocaleGroups,0);
    assert.equal(output.summary.expectedRoutesMissing,0);
    assert.equal(output.summary.expectedRoutesWrongLocale,0);
    assert.equal(output.summary.technicalErrors,0);
    assert.equal(output.summary.auditedBuildPages,4);
    assert.equal(output.localeParity.summary.completeLocaleGroups,1);
    assert.equal(output.staticBuild.summary.expectedRoutesFound,3);
    for(const key of ['actualPublishedSiteVerified','verifiedOfficialIbge',
      'realTranslationQualityVerified','realBusinessLocalPresenceVerified',
      'independentlyApprovedEditorialContent','trustedProductionSignerVerified',
      'customerDisplayAuthorized','publicationAuthorized','indexingAuthorized',
      'networkPerformed'])assert.equal(output[key],false,key);
    assert.doesNotMatch(JSON.stringify(output),
      /fortaleza-ce|2304400|site-onepage|imaginecomunicacao.com.br/);
  });
});
test('F123 blocks incomplete locale inventory even when existing HTML is good',async()=>{
  await site(async({input})=>{
    const result=await review({...input,inventoryInput:manifest(['pt-BR'])});
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.incompleteLocaleGroups,1);
    assert.equal(result.summary.missingLocaleSlots,2);
    assert.equal(result.summary.expectedRoutesMissing,0);
    assert.equal(result.staticBuild.reviewStatus,'human_independent_review_required');
  });
});
test('F123 blocks a real compiled HTML language mismatch despite complete inventory',async()=>{
  await site(async({input,root})=>{
    const file=join(root,'es','sitios','onepage','fortaleza','index.html');
    const original=await readFile(file,'utf8');
    await writeFile(file,original.replace('lang="es"','lang="pt-BR"'));
    const result=await review(input);
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.incompleteLocaleGroups,0);
    assert.equal(result.summary.expectedRoutesWrongLocale,1);
  });
});
test('F123 blocks private preview in public HTML and does not leak it',async()=>{
  await site(async({input,root})=>{
    const file=join(root,'en','sites','onepage','fortaleza','index.html');
    const original=await readFile(file,'utf8');
    await writeFile(file,original.replace('</head>',
      '<meta name="imagine:editorial-preview" content="private-unpublished-review"></head>'));
    const result=await review(input);
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.privateEditorialPreviewLeaks,1);
    assert.equal(result.publicationAuthorized,false);
  });
});
test('F123 rejects changed trust context and extra unvalidated permissions',async()=>{
  await site(async({input})=>{
    await assert.rejects(review({...input,publish:true}),/SEO F123/);
    await assert.rejects(review({...input,siteUrl:5}),/SEO F123/);
    await assert.rejects(review({...input,inventoryInput:{
      ...input.inventoryInput,accessToken:'secret'
    }}),/SEO F108/);
  });
});
