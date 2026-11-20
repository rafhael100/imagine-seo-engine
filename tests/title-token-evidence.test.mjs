import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
async function auditHeads(heads){
  const root=await mkdtemp(join(tmpdir(),'seo-title-tokens-'));
  try{
    for(const [route,titleMarkup] of Object.entries(heads)){
      const file=join(root,route.slice(1)+'index.html');
      await mkdir(dirname(file),{recursive:true});
      await writeFile(file,'<!doctype html><html lang="pt-BR"><head>'+titleMarkup+
        '<meta name="description" content="Original synthetic description for '+route+'">'+
        '<meta name="robots" content="index,follow">'+
        '<meta property="og:url" content="'+ORIGIN+route+'">'+
        '<link rel="canonical" href="'+ORIGIN+route+'">'+
        '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
        '</head><body><h1>Original page '+route+'</h1>'+Object.keys(heads)
          .filter(other=>other!==route).map(other=>'<a href="'+other+'">Another page</a>').join('')+
        '</body></html>');
    }
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+Object.keys(heads)
      .map(route=>'<url><loc>'+ORIGIN+route+'</loc></url>').join('')+'</urlset>');
    return await auditStaticSite(root,{strictPublicHead:true});
  }finally{await rm(root,{recursive:true,force:true});}
}

const missingTitle={type:'missing_title',file:'index.html',message:'Page has no title'};
const duplicateTitle={type:'duplicate_title',file:'second/index.html',message:'Same title as index.html'};

for(const [label,markup] of [
  ['no title',''],
  ['an apparent title in a double-quoted META value',
    '<meta name="example" content="<title>PRIVATE_QUOTED_TITLE</title>">'],
  ['an apparent title in a single-quoted META value',
    "<meta name='example' content='<title>PRIVATE_QUOTED_TITLE</title>'>"],
  ['an apparent title in a LINK attribute',
    '<link rel="stylesheet" href="/style.css" data-example="<title>PRIVATE_QUOTED_TITLE</title>">'],
  ['an empty real title after an apparent quoted title',
    '<meta name="example" content="<title>PRIVATE_QUOTED_TITLE</title>"><title> \t </title>'],
  ['inert comment template script and style examples',
    '<!-- <title>Comment</title> --><template><title>Template</title></template>'+
    '<script>const text="<title>Script</title>";</script>'+
    '<style>.example::before{content:"<title>Style</title>"}</style>']
]){
  test(label+' cannot satisfy the actual title requirement',async()=>{
    const report=await auditHeads({'/':markup});
    assert.deepEqual(report.errors,[missingTitle],'ASSERT_ACTUAL_TITLE_REQUIRED: '+label);
    assert.deepEqual(report.warnings,[]);
    assert.doesNotMatch(JSON.stringify(report),/PRIVATE_QUOTED_TITLE/);
  });
}

test('a shared quoted title example cannot duplicate two different real titles',async()=>{
  const example='<meta name="example" content="<title>Shared example</title>">';
  const report=await auditHeads({
    '/':example+'<title>First original title</title>',
    '/second/':example+'<title>Second original title</title>'
  });
  assert.deepEqual(report.summary,{pages:2,errors:0,warnings:0},'ASSERT_NO_QUOTED_TITLE_COLLISION');
});

test('different quoted title examples cannot conceal duplicate actual titles',async()=>{
  const report=await auditHeads({
    '/':'<meta name="example" content="<title>First example</title>"><title>Actual shared title</title>',
    '/second/':'<meta name="example" content="<title>Second example</title>"><title>Actual shared title</title>'
  });
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.warnings,[duplicateTitle],'ASSERT_ACTUAL_TITLE_COLLISION');
});

test('greater-than in title attributes does not contaminate its actual text',async()=>{
  const report=await auditHeads({
    '/':'<title data-example="> first attribute">Actual shared title</title>',
    '/second/':'<title data-example="> second attribute">Actual shared title</title>'
  });
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.warnings,[duplicateTitle],'ASSERT_TITLE_TEXT_EXCLUDES_ATTRIBUTES');
});

test('an apparent title closing tag in its opening attribute remains opaque',async()=>{
  const report=await auditHeads({
    '/':'<title data-example="</title> first attribute">Actual shared title</title>',
    '/second/':'<title data-example="</title> second attribute">Actual shared title</title>'
  });
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.warnings,[duplicateTitle],'ASSERT_TITLE_CLOSING_ATTRIBUTE_IS_OPAQUE');
});

test('actual uppercase titles retain existing whitespace normalization',async()=>{
  const report=await auditHeads({
    '/':'<TITLE class="first">  Actual\n shared\t title </TITLE>',
    '/second/':'<title>Actual shared title</title>'
  });
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.warnings,[duplicateTitle]);
});

test('literal apparent opening tags remain part of actual TITLE RCDATA',async()=>{
  const report=await auditHeads({
    '/':'<title>Actual <meta name=example> title</title>',
    '/second/':'<title>Actual <meta name=example> title</title>'
  });
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.warnings,[duplicateTitle]);
});
