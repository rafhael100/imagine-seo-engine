import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/review-municipal-build-offline.mjs',import.meta.url));
const origin='https://imaginecomunicacao.com.br/';
const sites={
 'pt-BR':['/servicos/site-onepage/fortaleza-ce/','pt-BR'],
 'en-US':['/en/sites/onepage/fortaleza/','en'],
 'es-ES':['/es/sitios/onepage/fortaleza/','es']
};
function render(path,lang,body,alternates=''){
 const url=new URL(path,origin).href;
 return '<!doctype html><html lang="'+lang+'"><head>'+
  '<meta charset="utf-8"><title>Imagine '+lang+' '+path+'</title>'+
  '<meta name="description" content="Service '+lang+' '+path+' for local review.">'+
  '<meta name="robots" content="index,follow">'+
  '<meta property="og:url" content="'+url+'">'+
  '<link rel="canonical" href="'+url+'">'+alternates+
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
  '</head><body><h1>Imagine services '+lang+'</h1><p>'+body+'</p></body></html>';
}
const run=(path,dir,url=origin)=>spawnSync(process.execPath,[script,path,dir,url],{
 encoding:'utf8',timeout:30000,maxBuffer:3*1024*1024
});
async function fixture(callback){
 const root=await mkdtemp(join(tmpdir(),'seo-f125-cli-'));
 try{
  const build=join(root,'static-build');
  await mkdir(build);
  const locs=Object.values(sites).map(x=>x[0]);
  const alts=Object.values(sites).map(([path,lang])=>
    '<link rel="alternate" hreflang="'+lang+'" href="'+new URL(path,origin).href+'">'
  ).join('');
  await writeFile(join(build,'index.html'),render('/','pt-BR',
    locs.map(path=>'<a href="'+path+'">See</a>').join('')));
  await writeFile(join(build,'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
  await writeFile(join(build,'sitemap.xml'),'<urlset>'+
    ['/',...locs].map(path=>
      '<url><loc>'+new URL(path,origin).href+'</loc></url>').join('')+'</urlset>');
  const rows=[];
  for(const [locale,[path,lang]] of Object.entries(sites)){
    const folder=join(build,...path.split('/').filter(Boolean));
    await mkdir(folder,{recursive:true});
    await writeFile(join(folder,'index.html'),
      render(path,lang,'Genuine distinct editorial text '+locale,alts));
    rows.push({
      serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
      locale,canonicalPath:path,
      contentSha256:createHash('sha256').update('original text '+locale).digest('hex')
    });
  }
  const inventory=join(root,'private-editorial-input.json');
  await writeFile(inventory,JSON.stringify({
    sourceType:'operator_local_inventory_unverified',entries:rows
  }),{mode:0o600});
  await callback({root,build,inventory});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('F125 CLI validates actual multilingual build, returns review-only and hides details',async()=>{
 await fixture(async({inventory,build})=>{
  const output=run(inventory,build);
  assert.equal(output.status,0,output.stderr);
  assert.equal(output.stderr,'');
  const report=JSON.parse(output.stdout);
  assert.equal(report.reviewStatus,'human_independent_review_required');
  assert.equal(report.summary.missingHreflangLinks,0);
  assert.equal(report.publicationAuthorized,false);
  assert.equal(report.customerDisplayAuthorized,false);
  for(const hidden of ['2304400','fortaleza-ce','site-onepage',
    'imaginecomunicacao.com.br',inventory,build])
    assert.equal((output.stdout+output.stderr).includes(hidden),false,hidden);
 });
});
test('F125 CLI returns exit 2 when compiled HTML loses required hreflang',async()=>{
 await fixture(async({inventory,build})=>{
  const file=join(build,'en','sites','onepage','fortaleza','index.html');
  const body=await readFile(file,'utf8');
  await writeFile(file,body.replace(/<link rel="alternate"[^>]*>/g,''));
  const output=run(inventory,build);
  assert.equal(output.status,2,output.stderr);
  assert.equal(output.stderr,'');
  assert.equal(JSON.parse(output.stdout).summary.missingHreflangLinks,3);
 });
});
test('F125 CLI rejects inventory symlink, HTTP origin and malformed JSON safely',async()=>{
 await fixture(async({inventory,build,root})=>{
  const linked=join(root,'linked-inventory.json');
  await symlink(inventory,linked);
  for(const output of [run(linked,build),run(inventory,build,'http://example.com/')]){
    assert.equal(output.status,1);
    assert.equal(output.stdout,'');
    assert.equal(output.stderr,'SEO F125: invalid or unsafe offline build review\n');
  }
  await writeFile(inventory,'{"sensitive":');
  const output=run(inventory,build);
  assert.equal(output.status,1);
  assert.equal(output.stdout,'');
  assert.doesNotMatch(output.stderr,/sensitive|private-editorial|example.com/);
 });
});
