import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';
import {prepareLocalMunicipalEditorialPreviews} from '../src/geo-editorial-html-previews.mjs';
import {createHash} from 'node:crypto';

const origin='https://imaginecomunicacao.com.br';
const page=route=>'<!doctype html><html lang="pt-BR"><head>'+
  '<title>Título exclusivo '+route+'</title>'+
  '<meta name="description" content="Descrição comercial única '+route+'">'+
  '<meta name="robots" content="index,follow">'+
  '<link rel="canonical" href="'+origin+route+'">'+
  '</head><body><h1>Página pública '+route+'</h1></body></html>';
async function withSite(files,run){
  const root=await mkdtemp(join(tmpdir(),'seo-f113-'));
  try{
    await mkdir(join(root,'servicos'),{recursive:true});
    await writeFile(join(root,'index.html'),files.home??page('/'));
    await writeFile(join(root,'servicos/index.html'),files.service??page('/servicos/'));
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),
      '<urlset><url><loc>'+origin+'/</loc></url>'+
      '<url><loc>'+origin+'/servicos/</loc></url></urlset>');
    await run(root);
  }finally{await rm(root,{recursive:true,force:true});}
}
const fakeInput=()=>{
  const body='As equipes que prestam serviços regionais precisam de conteúdo original, atendimento comprovado, acessibilidade e descrições comerciais claras. '.repeat(4);
  const digest=createHash('sha256').update('independent-other-body').digest('hex');
  return {
    screenInput:{
      draftBatchInput:{
        candidates:[{
          serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
          city:'Fortaleza',availabilityConfirmed:true,
          reasonForLocalPage:'A página será analisada editorialmente por uma pessoa responsável, com verificação da disponibilidade local do serviço e fontes comprováveis antes de publicar.',
          localContent:body,demandEvidence:[{
            source:'editorial_research',observedAt:'2026-11-09',
            explanation:'Registro editorial preliminar, sem dados verificados.'
          }]
        }],
        existing:[],maxSimilarity:0.75
      },
      inventoryInput:{
        sourceType:'operator_local_inventory_unverified',
        entries:[{
          serviceSlug:'landing-pages',ibgeCode:'2611606',state:'PE',
          locale:'pt-BR',canonicalPath:'/servicos/landing-pages/recife-pe/',
          contentSha256:digest
        }]
      }
    },
    municipalityReference:{
      sourceType:'operator_supplied_municipality_reference_unverified',
      entries:[
        {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
        {ibgeCode:'2611606',state:'PE',city:'Recife'}
      ]
    }
  };
};
test('F112 preview always has an explicit private marker in head',()=>{
  const result=prepareLocalMunicipalEditorialPreviews(fakeInput());
  assert.equal(result.summary.previewsPrepared,1);
  assert.match(result.documents[0].html,
    /<meta name="imagine:editorial-preview" content="private-unpublished-review">/);
  assert.match(result.documents[0].html,/noindex,nofollow,noarchive/);
});
test('F113 flags a private preview inside a public build even if noindex removed',async()=>{
  const document=prepareLocalMunicipalEditorialPreviews(fakeInput()).documents[0].html;
  const tampered=document
    .replace('<meta name="robots" content="noindex,nofollow,noarchive">',
      '<meta name="robots" content="index,follow">');
  await withSite({service:tampered},async root=>{
    const result=await auditStaticSite(root);
    assert.ok(result.errors.some(e=>e.type==='private_editorial_preview_in_public_build'&&
      e.file==='servicos/index.html'));
    assert.ok(!result.errors.some(e=>e.type==='unexpected_noindex'&&
      e.file==='servicos/index.html'));
    assert.equal(result.routes.includes('/servicos/'),true);
  });
});
test('legacy private preview text is a second tripwire even without marker',async()=>{
  const legacy=page('/servicos/').replace('</body>',
    '<div class="warning">RASCUNHO INTERNO — NÃO PUBLICAR NEM INDEXAR.</div></body>');
  await withSite({service:legacy},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.errors.filter(e=>e.type===
      'private_editorial_preview_in_public_build').length,1);
  });
});
test('quoted marker in HTML comment or inert template is not public evidence',async()=>{
  const harmless=page('/servicos/').replace('</head>',
    '<!-- <meta name="imagine:editorial-preview" content="private-unpublished-review"> -->'+
    '</head>').replace('</body>',
    '<template>RASCUNHO INTERNO — NÃO PUBLICAR NEM INDEXAR</template></body>');
  await withSite({service:harmless},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.errors.filter(e=>e.type===
      'private_editorial_preview_in_public_build').length,0);
  });
});
test('ordinary public HTML remains unaffected by F113 tripwire',async()=>{
  await withSite({},async root=>{
    const result=await auditStaticSite(root);
    assert.equal(result.errors.length,0);
    assert.equal(result.summary.pages,2);
  });
});
