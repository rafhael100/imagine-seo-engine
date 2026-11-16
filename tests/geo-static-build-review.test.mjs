import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewMunicipalStaticBuild as review} from '../src/geo-static-build-review.mjs';

const origin='https://imaginecomunicacao.com.br/';
const path='/servicos/site-onepage/fortaleza-ce/';
const html=(route,body,extraHead='')=>
  '<!doctype html><html lang="pt-BR"><head>'+
  '<meta charset="utf-8"><title>Imagine conteúdo original '+route+'</title>'+
  '<meta name="description" content="Página editorial de serviço '+route+' com informações comerciais.">'+
  '<meta name="robots" content="index,follow">'+
  '<meta property="og:url" content="'+new URL(route,origin).href+'">'+
  '<link rel="canonical" href="'+new URL(route,origin).href+'">'+
  extraHead+
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
  '</head><body><h1>Conteúdo do serviço</h1>'+body+'</body></html>';
const manifest=(changes={})=>({
  sourceType:'operator_local_inventory_unverified',
  entries:[{
    serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
    locale:'pt-BR',canonicalPath:path,
    contentSha256:createHash('sha256').update('declared-editorial-body-not-html').digest('hex'),
    ...changes
  }]
});
async function withBuild(fn,{preview=false,broken=false}={}){
  const root=await mkdtemp(join(tmpdir(),'seo-f114-'));
  try{
    const target=join(root,'servicos','site-onepage','fortaleza-ce');
    await mkdir(target,{recursive:true});
    const home=html('/','<a href="'+path+'">Ver serviço</a>');
    const marker=preview?'<meta name="imagine:editorial-preview" content="private-unpublished-review">':'';
    const page=html(path,broken?'<a href="/private-unpublished-route/">Não publicar</a>':
      '<p>Site Onepage profissional com atendimento regional.</p>',marker);
    await writeFile(join(root,'index.html'),home);
    await writeFile(join(target,'index.html'),page);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+
      '<url><loc>'+origin+'</loc></url>'+
      '<url><loc>'+new URL(path,origin).href+'</loc></url></urlset>');
    await fn(root);
  }finally{await rm(root,{recursive:true,force:true});}
}
test('F114 matches real built route and remains review-only',async()=>{
  await withBuild(async root=>{
    const result=await review({
      inventoryInput:manifest(),buildDirectory:root,siteUrl:origin
    });
    assert.equal(result.contractVersion,
      'seo-municipal-static-build-reconciliation-offline-v1');
    assert.equal(result.reviewStatus,'human_independent_review_required');
    assert.equal(result.summary.inventoryEntries,1);
    assert.equal(result.summary.auditedBuildPages,2);
    assert.equal(result.summary.expectedRoutesFound,1);
    assert.equal(result.summary.expectedRoutesMissing,0);
    assert.equal(result.summary.otherSitePages,1);
    assert.equal(result.summary.technicalErrors,0);
    assert.deepEqual(result.missingInventoryIndices,[]);
    for(const k of ['confirmedPublishedSite','authenticatedIbgeReference',
      'realContentDigestVerified','inventoryCompletenessVerified',
      'editorialApprovalVerified','productionCanonicalVerified',
      'customerDisplayAuthorized','deploymentAuthorized',
      'indexingAuthorized','networkPerformed'])
      assert.equal(result[k],false,k);
    assert.equal(result.auditedRealLocalFiles,true);
    assert.doesNotMatch(JSON.stringify(result),/fortaleza-ce|2304400|site-onepage/);
  });
});
test('F114 blocks a missing expected municipal route with ordinal index only',async()=>{
  await withBuild(async root=>{
    const result=await review({
      inventoryInput:manifest({canonicalPath:'/servicos/site-onepage/outra-cidade/'}),
      buildDirectory:root,siteUrl:origin
    });
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.expectedRoutesMissing,1);
    assert.deepEqual(result.missingInventoryIndices,[0]);
    assert.doesNotMatch(JSON.stringify(result),/outra-cidade|fortaleza-ce/);
  });
});
test('F114 blocks a private preview marker in build even when robots is index',async()=>{
  await withBuild(async root=>{
    const result=await review({inventoryInput:manifest(),buildDirectory:root,siteUrl:origin});
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.privateEditorialPreviewLeaks,1);
    assert.ok(result.technicalErrorTypes.some(e=>
      e.code==='private_editorial_preview_in_public_build'&&e.count===1));
    assert.equal(result.deploymentAuthorized,false);
  },{preview:true});
});
test('F114 reuses the actual static auditor for broken internal routes',async()=>{
  await withBuild(async root=>{
    const result=await review({inventoryInput:manifest(),buildDirectory:root,siteUrl:origin});
    assert.equal(result.reviewStatus,'blocked');
    assert.ok(result.technicalErrorTypes.some(x=>x.code==='broken_internal_link'));
    assert.doesNotMatch(JSON.stringify(result),/private-unpublished-route/);
  },{broken:true});
});
test('F114 rejects duplicate manifest and never treats a partial inventory as complete',async()=>{
  await withBuild(async root=>{
    const entry=manifest().entries[0];
    const result=await review({
      inventoryInput:{...manifest(),entries:[entry,{...entry}]},
      buildDirectory:root,siteUrl:origin
    });
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.inventoryConflicts,3);
    assert.equal(result.inventoryCompletenessVerified,false);
  });
});
test('F114 fails closed on invalid input/HTTP origin and auditor page budget',async()=>{
  await withBuild(async root=>{
    const base={inventoryInput:manifest(),buildDirectory:root,siteUrl:origin};
    await assert.rejects(review({...base,authorization:true}),/SEO F114/);
    await assert.rejects(review({...base,siteUrl:'http://imaginecomunicacao.com.br/'}),
      /HTTPS origin/);
    const huge={...manifest(),entries:Array.from({length:20001},(_,i)=>({
      ...manifest().entries[0],canonicalPath:'/new-'+i+'/',
      ibgeCode:String(2000000+i),contentSha256:String(i).padStart(64,'0')
    }))};
    await assert.rejects(review({...base,inventoryInput:huge}),/at most 20000/);
  });
});

test('F117 denies an existing route when inventory EN locale conflicts with PT HTML',async()=>{
  await withBuild(async root=>{
    const result=await review({
      inventoryInput:manifest({locale:'en-US'}),buildDirectory:root,siteUrl:origin
    });
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.expectedRoutesFound,1);
    assert.equal(result.summary.expectedRoutesMissing,0);
    assert.equal(result.summary.expectedRoutesWrongLocale,1);
    assert.deepEqual(result.wrongLocaleInventoryIndices,[0]);
    assert.equal(result.deploymentAuthorized,false);
    assert.doesNotMatch(JSON.stringify(result),
      /fortaleza-ce|2304400|site-onepage|imaginecomunicacao.com.br/);
  });
});
test('F117 recognizes en-US manifest for genuine EN root and es-ES for ES root',async()=>{
  await withBuild(async root=>{
    const {readFile}=await import('node:fs/promises');
    const file=join(root,'servicos','site-onepage','fortaleza-ce','index.html');
    const original=await readFile(file,'utf8');
    for(const [locale,lang] of [['en-US','en'],['es-ES','es']]){
      await writeFile(file,original.replace('lang="pt-BR"','lang="'+lang+'"'));
      const result=await review({
        inventoryInput:manifest({locale}),buildDirectory:root,siteUrl:origin
      });
      assert.equal(result.summary.expectedRoutesWrongLocale,0,locale);
      assert.equal(result.reviewStatus,'human_independent_review_required');
    }
  });
});
test('F117 rejects an invalid root locale even when route and canonical match',async()=>{
  await withBuild(async root=>{
    const {readFile}=await import('node:fs/promises');
    const file=join(root,'servicos','site-onepage','fortaleza-ce','index.html');
    const original=await readFile(file,'utf8');
    await writeFile(file,original.replace('lang="pt-BR"','lang="fr-FR"'));
    const result=await review({
      inventoryInput:manifest(),buildDirectory:root,siteUrl:origin
    });
    assert.equal(result.reviewStatus,'blocked');
    assert.equal(result.summary.expectedRoutesWrongLocale,1);
    assert.ok(result.technicalWarningTypes.some(x=>x.code==='invalid_root_lang'));
  });
});
