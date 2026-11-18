import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {auditStaticSite} from '../src/audit-static.mjs';
import {filterStaticHtml,iterateOpeningHtmlTags} from '../src/head-metadata-attributes.mjs';

const ORIGIN='https://imaginecomunicacao.com.br';
const TITLE='<title>Original declaration fixture</title>';
const DESCRIPTION='<meta name="description" content="Original synthetic description">';
const CANONICAL='<link rel="canonical" href="'+ORIGIN+'/">';
const HEADING='<h1>Original declaration fixture</h1>';
const SCHEMA='<script type="application/ld+json">'+
  '{"@context":"https://schema.org","@type":"Organization"}</script>';
const INVALID_SCHEMA='<script type="application/ld+json">SYNTHETIC_NOT_JSON</script>';
const schemaWarning={type:'missing_jsonld',file:'index.html',message:'No JSON-LD (not always necessary)'};
const DECLARATIONS=[
  ['DOCTYPE SYSTEM identifier',markup=>"<!DOCTYPE html SYSTEM '"+markup+"'>"],
  ['DOCTYPE PUBLIC identifier',markup=>"<!DoCtYpE html PUBLIC '"+markup+"'>"],
  ['unknown declaration',markup=>'<!audit '+markup+'>'],
  ['processing instruction',markup=>'<?audit '+markup+'?>']
];

function page(){
  return '<!doctype html><html lang="pt-BR"><head>'+TITLE+DESCRIPTION+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+ORIGIN+'/">'+CANONICAL+SCHEMA+
    '</head><body>'+HEADING+'</body></html>';
}
async function audit(html){
  const root=await mkdtemp(join(tmpdir(),'seo-html-declaration-'));
  try{
    await writeFile(join(root,'index.html'),html);
    await writeFile(join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>');
    return await auditStaticSite(root,{strictPublicHead:true});
  }finally{await rm(root,{recursive:true,force:true});}
}
function assertHealthy(report){
  assert.deepEqual(report.summary,{pages:1,errors:0,warnings:0});
}

for(const [label,wrap] of DECLARATIONS){
  test('apparent JSON-LD absorbed by '+label+' cannot satisfy schema presence',async()=>{
    const report=await audit(page().replace(SCHEMA,wrap(SCHEMA)));
    assert.deepEqual(report.errors,[]);
    assert.deepEqual(report.warnings,[schemaWarning]);
  });

  test('apparent invalid JSON-LD in '+label+' cannot invalidate a later real script',async()=>{
    assertHealthy(await audit(page().replace(SCHEMA,wrap(INVALID_SCHEMA)+SCHEMA)));
  });

  test(label+' ends at its first greater-than even inside quoted text',async()=>{
    // The first > ends the declaration, before its apparent quote/suffix.
    // The SCRIPT that follows is a real element and must remain eligible.
    assertHealthy(await audit(page().replace(SCHEMA,
      wrap('<meta data-example="first >'+SCHEMA))));
  });
}

for(const [label,actual,replacement,error] of [
  ['TITLE',TITLE,"<!DOCTYPE html SYSTEM '"+TITLE+"'>",'missing_title'],
  ['description',DESCRIPTION,'<!audit '+DESCRIPTION+'>','missing_description'],
  ['canonical',CANONICAL,'<?audit '+CANONICAL+'?>','missing_canonical'],
  ['H1',HEADING,'<!audit '+HEADING+'>','heading_count']
]){
  test('an apparent '+label+' in a declaration cannot substitute an omitted element',async()=>{
    const report=await audit(page().replace(actual,replacement));
    assert.deepEqual(report.errors.map(issue=>issue.type),[error]);
    assert.deepEqual(report.warnings,[]);
  });
}

test('an apparent root HTML in a declaration cannot supply an omitted language',async()=>{
  const report=await audit(page().replace('<html lang="pt-BR">','<!audit <html lang="pt-BR">>'));
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.warnings,[{type:'missing_ptbr_lang',file:'index.html',
    message:'Exactly one pt-BR language on root html required'}]);
});

test('an apparent root before the actual HTML cannot override its language',async()=>{
  assertHealthy(await audit('<?audit <html lang="en">?>'+page()));
});

test('an apparent HEAD in a declaration cannot create an explicit head section',async()=>{
  const report=await audit(page().replace('<head>','<!audit <head>>'));
  for(const type of ['missing_title','missing_description','missing_robots_meta',
    'missing_og_url','missing_canonical'])
    assert.ok(report.errors.some(issue=>issue.type===type),'Expected '+type);
});

test('an apparent BODY in a declaration cannot create an explicit body section',async()=>{
  const report=await audit(page().replace('<body>','<?audit <body>?>'));
  assert.deepEqual(report.errors,[{type:'heading_count',file:'index.html',message:'One H1 required; found 0'}]);
});

test('an apparent head closing in a declaration cannot conceal later noindex',async()=>{
  const report=await audit(page().replace('</head>',
    '<!audit </head>><meta name="googlebot" content="noindex"></head>'));
  assert.ok(report.errors.some(issue=>issue.type==='googlebot_indexing_blocked'));
});

test('an apparent body closing in a declaration cannot conceal a later broken link',async()=>{
  const report=await audit(page().replace('</body>',
    '<?audit </body>?><a href="/missing/">Missing destination</a></body>'));
  assert.ok(report.errors.some(issue=>issue.type==='broken_internal_link'));
});

test('an apparent TEMPLATE opening in a declaration cannot hide the following document',async()=>{
  assertHealthy(await audit(page().replace('<head>','<head><!audit <template>>')));
});

test('an apparent TEMPLATE closing in a declaration cannot expose inert metadata',async()=>{
  assertHealthy(await audit(page().replace('</head>',
    '<template><!audit </template>><meta name="googlebot" content="noindex"></template></head>')));
});

test('an apparent BASE in a declaration does not change URL resolution evidence',async()=>{
  assertHealthy(await audit(page().replace('</head>','<!audit <base href="/different/">></head>')));
});

test('an apparent robots META in a declaration is not an actual indexing restriction',async()=>{
  assertHealthy(await audit(page().replace('</head>',
    '<?audit <meta name="googlebot" content="noindex">?></head>')));
});

test('an apparent navigation link in a declaration is not an actual broken link',async()=>{
  assertHealthy(await audit(page().replace('</body>',
    '<!audit <a href="/missing/">Missing example</a>></body>')));
});

test('an apparent ID in a declaration cannot satisfy an actual fragment link',async()=>{
  const report=await audit(page().replace('</body>',
    '<!audit <span id="target">Example</span>><a href="#target">Target</a></body>'));
  assert.deepEqual(report.errors,[]);
  assert.ok(report.warnings.some(issue=>issue.type==='broken_local_fragment'));
});

for(const [label,prefix] of [
  ['DOCTYPE','<!DOCTYPE html SYSTEM "'],
  ['unknown declaration','<!audit '],
  ['processing instruction','<?audit ']
]){
  test(label+' at EOF cannot expose an unterminated apparent opening tag',()=>{
    const html=prefix+'<h1 ';
    const filtered=filterStaticHtml(html);
    assert.equal(filtered,html);
    assert.deepEqual([...iterateOpeningHtmlTags(filtered)],[]);
  });
}

test('an ordinary comment keeps all content opaque past an internal greater-than',async()=>{
  assertHealthy(await audit(page().replace(SCHEMA,'<!-- example >'+INVALID_SCHEMA+' -->'+SCHEMA)));
});

test('declaration-looking text in raw content or quoted attributes remains opaque',async()=>{
  const html=page().replace('</body>',
    '<textarea><!audit <h1>Text</h1>></textarea>'+
    '<div data-example="<?audit > <h1>Text</h1>">Example</div></body>');
  assertHealthy(await audit(html));
});

test('apparent scripts in declarations do not consume the actual JSON-LD budget',async()=>{
  const examples=('<!audit '+SCHEMA+'>').repeat(129);
  assertHealthy(await audit(page().replace(SCHEMA,examples+SCHEMA)));
});

test('declarations still count toward the shared HTML token budget',async()=>{
  await assert.rejects(audit(page().replace('</body>','<!audit>'.repeat(50001)+'</body>')),
    /HTML token budget exceeded/);
});
