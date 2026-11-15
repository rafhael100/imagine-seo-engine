import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/render-geo-editorial-previews-offline.mjs',import.meta.url);
const run=(...args)=>spawnSync(process.execPath,[script.pathname,...args],{
  encoding:'utf8',timeout:18000,maxBuffer:1024*1024
});
async function files(dir,blocked=false){
  const source=[
    join(dir,'private-drafts.json'),
    join(dir,'private-inventory.json'),
    join(dir,'private-municipalities.json')
  ];
  const content='As empresas locais precisam de informações claras, atendimento real, páginas acessíveis, navegação e conteúdo original que responda a perguntas comerciais sem prometer resultados artificiais. '.repeat(3);
  await writeFile(source[0],JSON.stringify({
    candidates:[{
      serviceSlug:'site-onepage',ibgeCode:'2304400',
      city:'Fortaleza',state:blocked?'PE':'CE',
      availabilityConfirmed:true,
      reasonForLocalPage:'Um estudo editorial deve comprovar informações do serviço e sua disponibilidade na região antes de propor a publicação de conteúdo.',
      localContent:content,demandEvidence:[{
        source:'editorial_research',observedAt:'2026-11-09',
        explanation:'Registro editorial de avaliação sem confirmação externa.'
      }]
    }],existing:[],maxSimilarity:0.75
  }));
  await writeFile(source[1],JSON.stringify({
    sourceType:'operator_local_inventory_unverified',
    entries:[{
      serviceSlug:'landing-pages',ibgeCode:'2611606',state:'PE',
      locale:'pt-BR',canonicalPath:'/servicos/landing-pages/recife-pe/',
      contentSha256:createHash('sha256').update('unrelated body').digest('hex')
    }]
  }));
  await writeFile(source[2],JSON.stringify({
    sourceType:'operator_supplied_municipality_reference_unverified',
    entries:[
      {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
      {ibgeCode:'2611606',state:'PE',city:'Recife'}
    ]
  }));
  return source;
}
test('CLI writes a private noindex preview in a new directory only',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f112-'));
  try{
    const input=await files(dir);
    const output=join(dir,'local-preview-only');
    const r=run(...input,output);
    assert.equal(r.status,0,r.stderr);
    const summary=JSON.parse(r.stdout);
    assert.equal(summary.localPreviewFilesCreated,1);
    assert.equal(summary.humanPublicationApproved,false);
    assert.equal(summary.ibgeSourceAuthenticated,false);
    assert.ok(!r.stdout.includes('Fortaleza'));
    const html=await readFile(join(output,'draft-001.html'),'utf8');
    assert.ok(html.includes('Site Onepage em Fortaleza, CE'));
    assert.ok(html.includes('noindex,nofollow,noarchive'));
    assert.ok(!html.includes('href='));
    const parent=await stat(output),child=await stat(join(output,'draft-001.html'));
    if(process.platform!=='win32'){
      assert.equal(parent.mode&0o077,0);
      assert.equal(child.mode&0o077,0);
    }
    const repeat=run(...input,output);
    assert.equal(repeat.status,2,'existing output directory must never be overwritten');
    assert.doesNotMatch(repeat.stderr+repeat.stdout,/private-drafts|local-preview-only/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('blocked municipality leaves no output directory, no false approval',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-f112-'));
  try{
    const input=await files(dir,true);
    const output=join(dir,'no-publication');
    const r=run(...input,output);
    assert.equal(r.status,0,r.stderr);
    const summary=JSON.parse(r.stdout);
    assert.equal(summary.blockedDrafts,1);
    assert.equal(summary.localPreviewFilesCreated,0);
    await assert.rejects(stat(output),{code:'ENOENT'});
  }finally{await rm(dir,{recursive:true,force:true});}
});
