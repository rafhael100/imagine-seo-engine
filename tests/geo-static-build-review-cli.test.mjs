import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/review-geo-static-build-offline.mjs',import.meta.url);
const origin='https://imaginecomunicacao.com.br/';
const url='/servicos/site-onepage/fortaleza-ce/';
const run=(...args)=>spawnSync(process.execPath,[script.pathname,...args],{
  encoding:'utf8',timeout:20000,maxBuffer:1024*1024
});
function page(route,body){
  const full=new URL(route,origin).href;
  return '<!doctype html><html lang="pt-BR"><head><title>Teste único '+route+'</title>'+
    '<meta name="description" content="Descrição editorial original '+route+'">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+full+'">'+
    '<link rel="canonical" href="'+full+'">'+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Conteúdo original</h1>'+body+'</body></html>';
}
async function fixture(fn){
  const root=await mkdtemp(join(tmpdir(),'seo-f114-cli-'));
  try{
    const build=join(root,'static-dist');
    await mkdir(join(build,'servicos','site-onepage','fortaleza-ce'),{recursive:true});
    await writeFile(join(build,'index.html'),page('/','<a href="'+url+'">Veja a página</a>'));
    await writeFile(join(build,'servicos','site-onepage','fortaleza-ce','index.html'),
      page(url,'<p>Página planejada para site Onepage</p>'));
    await writeFile(join(build,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
    await writeFile(join(build,'sitemap.xml'),
      '<urlset><url><loc>'+origin+'</loc></url><url><loc>'+
      new URL(url,origin).href+'</loc></url></urlset>');
    const inventory=join(root,'sensitive-inventory.json');
    await writeFile(inventory,JSON.stringify({
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
        locale:'pt-BR',canonicalPath:url,
        contentSha256:createHash('sha256').update('offline editorial text').digest('hex')
      }]
    }));
    await fn({root,build,inventory});
  }finally{await rm(root,{recursive:true,force:true});}
}
test('CLI reads local compiled HTML and returns only sanitized counts',async()=>{
  await fixture(async({build,inventory})=>{
    const p=run(inventory,build,origin);
    assert.equal(p.status,0,p.stderr);
    const data=JSON.parse(p.stdout);
    assert.equal(data.reviewStatus,'human_independent_review_required');
    assert.equal(data.summary.expectedRoutesFound,1);
    assert.equal(data.summary.technicalErrors,0);
    assert.equal(data.deploymentAuthorized,false);
    for(const secret of ['fortaleza-ce','2304400','sensitive-inventory',
      'static-dist','site-onepage'])
      assert.ok(!p.stdout.includes(secret),secret);
  });
});
test('CLI exits nonzero on missing municipal route while not exposing path',async()=>{
  await fixture(async({build,inventory})=>{
    const path=join(build,'servicos','site-onepage','fortaleza-ce','index.html');
    await rm(path);
    const p=run(inventory,build,origin);
    assert.equal(p.status,1,p.stderr);
    const r=JSON.parse(p.stdout);
    assert.equal(r.reviewStatus,'blocked');
    assert.deepEqual(r.missingInventoryIndices,[0]);
    assert.doesNotMatch(p.stdout,/fortaleza-ce|sensitive-inventory/);
  });
});
test('CLI rejects bad JSON and extra switches without private paths or data',async()=>{
  await fixture(async({root,build})=>{
    const file=join(root,'very-private-secret-file.json');
    await writeFile(file,'{"PRIVATE_KEY_SEO_F114":');
    for(const p of [run(file,build,origin),
      run(file,build,origin,'--unsafe')]){
      assert.equal(p.status,2);
      assert.doesNotMatch(p.stderr+p.stdout,
        /PRIVATE_KEY_SEO_F114|very-private-secret-file|static-dist/);
    }
  });
});
