import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
const SCHEMA='<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>';
const languageWarning={type:'missing_ptbr_lang',file:'index.html',message:'Exactly one pt-BR language on root html required'};
const schemaWarning={type:'missing_jsonld',file:'index.html',message:'No JSON-LD (not always necessary)'};
const schemaError={type:'invalid_jsonld',file:'index.html',message:'Invalid JSON-LD syntax'};

async function audit({htmlOpening='<html lang="pt-BR">',headExtra='',bodyExtra='',schema=SCHEMA}={},options={}){
  const root=await mkdtemp(join(tmpdir(),'seo-root-schema-tokens-'));
  try{
    await writeFile(join(root,'index.html'),'<!doctype html>'+htmlOpening+'<head>'+
      '<title>Imagine original synthetic page</title>'+
      '<meta name="description" content="Original synthetic page description">'+
      '<meta name="robots" content="index,follow">'+
      '<meta property="og:url" content="'+ORIGIN+'/">'+
      '<link rel="canonical" href="'+ORIGIN+'/">'+headExtra+schema+
      '</head><body><h1>Imagine original synthetic page</h1>'+bodyExtra+'</body></html>');
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead:true,...options});
  }finally{await rm(root,{recursive:true,force:true});}
}

for(const [label,fixture,expectedWarnings] of [
  ['a quoted apparent HTML element does not provide root language',
    {htmlOpening:'<html data-example="<html lang=\'pt-BR\'>">'},[languageWarning]],
  ['a quoted greater-than before the real root language does not truncate it',
    {htmlOpening:'<html data-example="A > B" lang="pt-BR">'},[]],
  ['apparent HTML inside META cannot substitute an omitted root element',
    {htmlOpening:'',headExtra:'<meta name="example" content="<html lang=\'pt-BR\'>">'},[languageWarning]],
  ['a quoted apparent lang assignment cannot duplicate the actual root language',
    {htmlOpening:'<html lang="pt-BR" data-example="<html lang=\'en\'>">'},[]],
  ['actual duplicate root language attributes still require review',
    {htmlOpening:'<html lang="en" lang="pt-BR">'},[languageWarning]],
  ['unquoted root language does not bypass the quoted-attribute contract',
    {htmlOpening:'<html lang=pt-BR>'},[languageWarning]],
  ['valid root attributes retain case and whitespace handling',
    {htmlOpening:'<HTML LANG = \' pt-BR \'>'},[]]
]){
  test(label,async()=>{
    const report=await audit(fixture);
    assert.deepEqual(report.errors,[]);
    assert.deepEqual(report.warnings,expectedWarnings,'ASSERT_ACTUAL_ROOT_LANGUAGE: '+label);
  });
}

test('multilingual root evidence is read after quoted greater-than attributes',async()=>{
  const report=await audit({htmlOpening:'<html data-example="A > B" lang="en-US">'},
    {allowedLanguages:['pt-BR','en-US','es-ES']});
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0},'ASSERT_MULTILINGUAL_ROOT_EVIDENCE');
});

for(const [label,fixture,errors,warnings] of [
  ['apparent schema in a META attribute is not a SCRIPT element',
    {schema:'',headExtra:'<meta name="example" content=\'<script type="application/ld+json">{}</script>\'>'},[],[schemaWarning]],
  ['apparent schema in textarea text is not a SCRIPT element',
    {schema:'',bodyExtra:'<textarea>'+SCHEMA+'</textarea>'},[],[schemaWarning]],
  ['apparent invalid schema in an attribute does not invalidate actual JSON-LD',
    {headExtra:'<meta name="example" content=\'<script type="application/ld+json">PRIVATE_SCHEMA_MARKER</script>\'>'},[],[]],
  ['a quoted greater-than before the actual type does not hide JSON-LD',
    {schema:'<script data-example="A > B" type="application/ld+json">{}</script>'},[],[]],
  ['a quoted greater-than after the actual type does not contaminate JSON',
    {schema:'<script type="application/ld+json" data-example="A > B">{}</script>'},[],[]],
  ['data-type cannot substitute the actual SCRIPT type attribute',
    {schema:'<script data-type="application/ld+json">{}</script>'},[],[schemaWarning]],
  ['a quoted apparent type assignment cannot change a JavaScript element',
    {schema:'<script type="text/javascript" data-example="type=\'application/ld+json\'">{}</script>'},[],[schemaWarning]],
  ['actual quoted schema type permits whitespace around equals',
    {schema:'<script TYPE = \'application/ld+json\'>{}</script>'},[],[]],
  ['actual malformed JSON retains the existing error',
    {schema:'<script type="application/ld+json">not-json</script>'},[schemaError],[]],
  ['unquoted schema type does not bypass the quoted-attribute contract',
    {schema:'<script type=application/ld+json>{}</script>'},[],[schemaWarning]],
  ['actual BODY JSON-LD remains eligible',
    {schema:'',bodyExtra:SCHEMA},[],[]],
  ['inert comments and templates cannot substitute actual schema',
    {schema:'<!-- '+SCHEMA+' --><template>'+SCHEMA+'</template>'},[],[schemaWarning]]
]){
  test(label,async()=>{
    const report=await audit(fixture);
    assert.deepEqual(report.errors,errors,'ASSERT_ACTUAL_JSONLD_ERRORS: '+label);
    assert.deepEqual(report.warnings,warnings,'ASSERT_ACTUAL_JSONLD_PRESENCE: '+label);
    assert.doesNotMatch(JSON.stringify(report),/PRIVATE_SCHEMA_MARKER/);
  });
}

test('inert schema examples do not consume the 128 actual SCRIPT budget',async()=>{
  const report=await audit({bodyExtra:'<textarea>'+SCHEMA.repeat(129)+'</textarea>'});
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});

test('129 actual JSON-LD SCRIPT elements still exceed the established budget',async()=>{
  await assert.rejects(audit({schema:SCHEMA.repeat(129)}),/JSON-LD script budget exceeded/);
});

test('root and SCRIPT attributes do not inherit the distinct META attribute cap',async()=>{
  const extras=Array.from({length:129},(_,index)=>' data-example-'+index+'="value"').join('');
  const report=await audit({
    htmlOpening:'<html'+extras+' lang="pt-BR">',
    schema:'<script'+extras+' type="application/ld+json">{}</script>'
  });
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
});

async function auditMultilingualLinks({mutate=markup=>markup,extraLinks=''}={}){
  const root=await mkdtemp(join(tmpdir(),'seo-hreflang-token-attributes-'));
  const routes=[['/','pt-BR'],['/en/','en'],['/es/','es']];
  try{
    const alternates=routes.map(([path,lang])=>mutate(
      '<link rel="alternate" hreflang="'+lang+'" href="'+ORIGIN+path+'">')).join('');
    for(const [path,lang] of routes){
      const folder=join(root,path.slice(1));
      await mkdir(folder,{recursive:true});
      await writeFile(join(folder,'index.html'),'<!doctype html><html lang="'+lang+'"><head>'+
        '<title>Original multilingual page '+lang+'</title>'+
        '<meta name="description" content="Original description for '+lang+'">'+
        '<meta name="robots" content="index,follow">'+
        '<meta property="og:url" content="'+ORIGIN+path+'">'+
        '<link rel="canonical" href="'+ORIGIN+path+'">'+extraLinks+alternates+SCHEMA+
        '</head><body><h1>Original content '+lang+'</h1>'+routes
          .filter(([other])=>other!==path).map(([other])=>'<a href="'+other+'">Other language</a>').join('')+
        '</body></html>');
    }
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+routes.map(([path])=>
      '<url><loc>'+ORIGIN+path+'</loc></url>').join('')+'</urlset>');
    return await auditStaticSite(root,{strictPublicHead:true,
      allowedLanguages:['pt-BR','en','es'],checkHreflang:true});
  }finally{await rm(root,{recursive:true,force:true});}
}

for(const name of ['href','hreflang','rel']){
  test('quoted apparent '+name+' cannot duplicate an actual hreflang link attribute',async()=>{
    const report=await auditMultilingualLinks({mutate:markup=>markup.replace('>',
      ' data-example="Literal '+name+'=\'PRIVATE_HREFLANG_MARKER\'">')});
    assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0},'ASSERT_REAL_HREFLANG_ATTRIBUTES: '+name);
    assert.doesNotMatch(JSON.stringify(report),/PRIVATE_HREFLANG_MARKER/);
  });
}

const RSS_EXAMPLE='<link rel="alternate" type="application/rss+xml" href="'+ORIGIN+'/feed.xml"'+
  ' data-example="Literal hreflang=\'en\'">';
test('quoted hreflang example does not turn a non-language RSS link into an alternate locale',async()=>{
  const report=await auditMultilingualLinks({extraLinks:RSS_EXAMPLE});
  assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0});
});
test('quoted hreflang examples do not consume the actual alternate-link budget',async()=>{
  const report=await auditMultilingualLinks({extraLinks:RSS_EXAMPLE.repeat(17)});
  assert.deepEqual(report.summary,{pages:3,errors:0,warnings:0});
});

for(const [name,from,to,error] of [
  ['rel','rel="alternate"','rel="alter&#110;ate"','invalid_hreflang'],
  ['hreflang','hreflang="en"','hreflang="e&#110;"','invalid_hreflang'],
  ['href','href="'+ORIGIN+'/en/"','href="'+ORIGIN+'/e&#110;/"','invalid_hreflang_url']
]){
  test('hreflang '+name+' keeps the existing literal character-reference review',async()=>{
    const report=await auditMultilingualLinks({mutate:markup=>markup.replace(from,to)});
    assert.ok(report.errors.some(issue=>issue.type===error),'ASSERT_HREFLANG_LITERAL_ENTITY_POLICY: '+name);
  });
}
test('17 actual hreflang links still exceed the established per-page budget',async()=>{
  const alternate='<link rel="alternate" hreflang="pt-BR" href="'+ORIGIN+'/">';
  await assert.rejects(auditMultilingualLinks({extraLinks:alternate.repeat(17)}),
    /hreflang link budget exceeded/);
});
