import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const origin='https://imaginecomunicacao.com.br';
const beforeRevision='a'.repeat(40),afterRevision='b'.repeat(40);
const cli=new URL('../scripts/compare-astro-builds-offline.mjs',import.meta.url).pathname;

const page=(route,{noindex=false}={})=>
 '<!doctype html><html lang="pt-BR"><head>'+
 '<title>Imagine — cenário técnico exclusivo '+route+'</title>'+
 '<meta name="description" content="Exemplo sintético e educativo de auditoria de metadados do site Imagine. Rota fictícia para validação local de regressões.">'+
 '<meta name="robots" content="'+(noindex?'noindex':'index,follow')+'">'+
 '<link rel="canonical" href="'+origin+route+'">'+
 '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
 '</head><body><h1>Conteúdo editorial independente '+route+'</h1></body></html>';

function build(root,{noindex=false,second=false}={}){
 mkdirSync(root,{recursive:true});
 writeFileSync(join(root,'index.html'),page('/',{noindex}));
 if(second){
  mkdirSync(join(root,'example'),{recursive:true});
  writeFileSync(join(root,'example/index.html'),page('/example/'));
 }
 writeFileSync(join(root,'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
 const paths=['/',...(second?['/example/']:[])];
 writeFileSync(join(root,'sitemap.xml'),
  '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
  paths.map(path=>'<url><loc>'+origin+path+'</loc></url>').join('')+
  '</urlset>');
}

test('F166: compares two actual local Astro-like builds, no false live release claims',()=>{
 const folder=mkdtempSync(join(tmpdir(),'seo-f166-'));
 const previous=join(folder,'before'),current=join(folder,'after');
 const invoke=(args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 try{
  build(previous);build(current);
  const clean=invoke([previous,current,beforeRevision,afterRevision]);
  assert.equal(clean.status,0,clean.stderr);
  const cleanReport=JSON.parse(clean.stdout);
  assert.equal(cleanReport.status,'NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS');
  assert.equal(cleanReport.routeCoverageComparable,true);
  assert.deepEqual(cleanReport.routeInventoryChanges,{added:0,removed:0});
  assert.equal(cleanReport.customerDisplayAuthorized,false);
  assert.equal(cleanReport.publicationAuthorized,false);
  assert.equal(cleanReport.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  assert.equal(cleanReport.previous.pages,1);
  build(current,{noindex:true});
  const regression=invoke([previous,current,beforeRevision,afterRevision]);
  assert.equal(regression.status,1,regression.stderr);
  const review=JSON.parse(regression.stdout);
  assert.equal(review.status,'REVIEW_AGGREGATE_REGRESSION');
  assert.ok(review.reviewIncreases.some(x=>x.code==='review_indexation'));
  assert.doesNotMatch(regression.stdout,/example|<html|PRIVATE-SOURCE/);
  build(current,{second:true});
  const changed=invoke([previous,current,beforeRevision,afterRevision]);
  assert.equal(changed.status,1,changed.stderr);
  assert.equal(JSON.parse(changed.stdout).status,'HOLD_ROUTE_COVERAGE_CHANGED');
  assert.deepEqual(JSON.parse(changed.stdout).routeInventoryChanges,{added:1,removed:0});
  assert.doesNotMatch(changed.stdout,/\/example\/|<html/);
 }finally{rmSync(folder,{recursive:true,force:true})}
});

test('F166: rejects identical revisions, malformed input, missing or repeated dirs without disclosing paths',()=>{
 const folder=mkdtempSync(join(tmpdir(),'seo-f166-'));
 const previous=join(folder,'PRIVATE-FILENAME'),current=join(folder,'after');
 const invoke=args=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 try{
  build(previous);build(current);
  const cases=[
   [previous,current,beforeRevision,beforeRevision],
   [previous,current,'main',afterRevision],
   [previous,previous,beforeRevision,afterRevision],
   [previous,join(folder,'SECRET-NOT-FOUND'),beforeRevision,afterRevision]
  ];
  for(const args of cases){
   const res=invoke(args);
   assert.equal(res.status,1,res.stderr);
   assert.doesNotMatch(res.stderr,/PRIVATE-FILENAME|SECRET-NOT-FOUND|\/tmp\//);
   assert.equal(res.stdout,'');
  }
  assert.equal(invoke([]).status,2);
 }finally{rmSync(folder,{recursive:true,force:true})}
});
