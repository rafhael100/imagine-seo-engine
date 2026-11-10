import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const script=name=>fileURLToPath(new URL('../scripts/'+name,import.meta.url));
function run(name,args=[]){
  const processResult=spawnSync(process.execPath,[script(name),...args],
    {encoding:'utf8',timeout:10000,maxBuffer:1024*1024});
  if(processResult.error)throw processResult.error;
  return processResult;
}
async function workspace(action){
  const dir=await mkdtemp(join(tmpdir(),'seo-engine-smoke-'));
  try{return await action(dir);}finally{await rm(dir,{recursive:true,force:true});}
}
const site='https://example.com';
const page=(route,links=[])=>'<!doctype html><html lang="pt-BR"><head>'+
  '<title>Unique title for '+route+'</title>'+
  '<meta name="description" content="A public test fixture">'+
  '<meta name="robots" content="index,follow">'+
  '<link rel="canonical" href="'+site+route+'">'+
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
  '</head><body><h1>Example fixture</h1>'+
  links.map(url=>'<a href="'+url+'">Link</a>').join('')+'</body></html>';

test('CLI audits a complete synthetic static build end to end',async()=>{
  await workspace(async dir=>{
    await mkdir(join(dir,'servicos'),{recursive:true});
    await writeFile(join(dir,'index.html'),page('/', ['/servicos/']));
    await writeFile(join(dir,'servicos/index.html'),page('/servicos/'));
    await writeFile(join(dir,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+site+'/sitemap.xml\n');
    await writeFile(join(dir,'sitemap.xml'),
      '<urlset><loc>'+site+'/</loc><loc>'+site+'/servicos/</loc></urlset>');
    const result=run('audit-dist.mjs',[dir,site+'/','--fail-on-warnings']);
    assert.equal(result.status,0,result.stderr);
    const report=JSON.parse(result.stdout);
    assert.equal(report.summary.pages,2);
    assert.deepEqual(report.routes,['/','/servicos/']);
    assert.deepEqual(report.summary,{pages:2,errors:0,warnings:0});
  });
});

test('CSV report and comparison CLIs never echo supplied raw queries',async()=>{
  await workspace(async dir=>{
    const header='Queries,Clicks,Impressions,CTR,Position\n';
    const sensitive='"pessoa@empresa.com",1,10,10%,3\n';
    const before=join(dir,'before.csv'),after=join(dir,'after.csv');
    await writeFile(before,header+'"landing pages",10,100,10%,8\n'+sensitive);
    await writeFile(after,header+'"landing pages",5,100,5%,9\n'+sensitive);
    const report=run('report-gsc-csv-offline.mjs',[before,'2026-10-01','2026-10-07']);
    assert.equal(report.status,0,report.stderr);
    assert.equal(JSON.parse(report.stdout).summary.redactedRows,1);
    assert.doesNotMatch(report.stdout,/landing pages|pessoa@empresa.com/);
    const compare=run('compare-gsc-csv-offline.mjs',
      [before,'2026-10-01','2026-10-07',after,'2026-10-08','2026-10-14']);
    assert.equal(compare.status,0,compare.stderr);
    assert.equal(JSON.parse(compare.stdout).summary.previous.clicks,10);
    assert.equal(JSON.parse(compare.stdout).summary.current.clicks,5);
    assert.doesNotMatch(compare.stdout,/landing pages|pessoa@empresa.com/);
  });
});

test('CLI regression gate fails on silently replaced public URLs',async()=>{
  await workspace(async dir=>{
    const before=join(dir,'before.json'),after=join(dir,'after.json');
    const clean=routes=>({
      summary:{pages:2,errors:0,warnings:0},routes,errors:[],warnings:[]
    });
    await writeFile(before,JSON.stringify(clean(['/','/servicos/'])));
    await writeFile(after,JSON.stringify(clean(['/','/planos/'])));
    const result=run('compare-audit-offline.mjs',[before,after]);
    assert.equal(result.status,1);
    const comparison=JSON.parse(result.stdout);
    assert.equal(comparison.passed,false);
    assert.deepEqual(comparison.removedRoutes,['/servicos/']);
  });
});

test('CSV and JSON CLIs refuse symlinked inputs without exposing file content',async()=>{
  await workspace(async dir=>{
    const real=join(dir,'sensitive.csv'), alias=join(dir,'queries.csv');
    await writeFile(real,'Queries,Clicks,Impressions,CTR,Position\n'+
      '"contact example@private.test",1,10,10%,8\n');
    await symlink(real,alias);
    const runResult=run('report-gsc-csv-offline.mjs',[alias,'2026-10-01','2026-10-07']);
    assert.equal(runResult.status,1);
    assert.match(runResult.stderr,/SEO input:/);
    assert.doesNotMatch(runResult.stderr+runResult.stdout,/example@private.test|contact example/);
    const realJson=join(dir,'report.json'), aliasJson=join(dir,'alias.json');
    await writeFile(realJson,JSON.stringify({dimensions:['query'],startDate:'2026-10-01',endDate:'2026-10-07',rows:[]}));
    await symlink(realJson,aliasJson);
    assert.equal(run('report-gsc-offline.mjs',[aliasJson]).status,1);
  });
});
test('audit regression CLI refuses symlink input as well',async()=>{
  await workspace(async dir=>{
    const report=join(dir,'audit.json'),alias=join(dir,'alias.json');
    const clean={summary:{pages:1,errors:0,warnings:0},routes:['/'],errors:[],warnings:[]};
    await writeFile(report,JSON.stringify(clean));
    await symlink(report,alias);
    const runResult=run('compare-audit-offline.mjs',[alias,report]);
    assert.equal(runResult.status,2);
    assert.match(runResult.stderr,/SEO input:/);
  });
});

test('executive brief CLI returns fixed categories and no path/messages',async()=>{
  await workspace(async dir=>{
    const auditFile=join(dir,'audit-brief.json');
    await writeFile(auditFile,JSON.stringify({
      summary:{pages:1,errors:1,warnings:0},
      routes:['/sensitive/path/'],errors:[{
        type:'unexpected_noindex',file:'private/file.html',
        message:'PRIVATE SECRET EXAMPLE'
      }],warnings:[]
    }));
    const result=run('report-seo-brief-offline.mjs',[auditFile]);
    assert.equal(result.status,0,result.stderr);
    assert.equal(JSON.parse(result.stdout).recommendedReviews[0].code,'review_indexation');
    assert.doesNotMatch(result.stdout,/PRIVATE SECRET|private\/file|sensitive\/path/);
  });
});

test('GSC malformed JSON diagnostics never print private input fragments',async()=>{
  await workspace(async dir=>{
    const path=join(dir,'sensitive.json');
    await writeFile(path,'{"password":"CLIENT-PASSWORD-SECRET", badly}');
    const result=run('report-gsc-offline.mjs',[path]);
    assert.equal(result.status,1);
    assert.match(result.stderr,/SEO input: invalid JSON/);
    assert.doesNotMatch(result.stderr+result.stdout,/CLIENT-PASSWORD-SECRET|password|badly/);
  });
});
test('GSC missing input diagnostics never print private absolute paths',async()=>{
  await workspace(async dir=>{
    const missing=join(dir,'CLIENT-SECRET-financial.json');
    const result=run('report-gsc-offline.mjs',[missing]);
    assert.equal(result.status,1);
    assert.match(result.stderr,/input_rejected/);
    assert.doesNotMatch(result.stderr+result.stdout,/CLIENT-SECRET|financial/);
  });
});
test('SEO executive brief malformed JSON errors omit user-provided text',async()=>{
  await workspace(async dir=>{
    const path=join(dir,'corrupt.json');
    await writeFile(path,'{"SECRET_TOKEN":"sensitive@example.com", invalid}');
    const result=run('report-seo-brief-offline.mjs',[path]);
    assert.equal(result.status,1);
    assert.match(result.stderr,/SEO input: invalid JSON/);
    assert.doesNotMatch(result.stderr+result.stdout,/SECRET_TOKEN|sensitive@example.com/);
  });
});

test('route migration CLI stays HOLD even if candidate maps deleted URLs',async()=>{
  await workspace(async dir=>{
    const files=['before.json','after.json','candidates.json'].map(x=>join(dir,x));
    await writeFile(files[0],JSON.stringify({routes:['/','/servicos/']}));
    await writeFile(files[1],JSON.stringify({routes:['/','/planos/']}));
    await writeFile(files[2],JSON.stringify([{from:'/servicos/',to:'/planos/'}]));
    const result=run('review-route-migration-offline.mjs',files);
    assert.equal(result.status,1);
    const report=JSON.parse(result.stdout);
    assert.equal(report.structurallyComplete,true);
    assert.equal(report.deploymentAuthorized,false);
    assert.doesNotMatch(result.stdout,/\/servicos\/|\/planos\//);
  });
});

test('Portal handoff CLI emits review-only envelope, not source file paths',async()=>{
  await workspace(async dir=>{
    const file=join(dir,'private-brief.json');
    await writeFile(file,JSON.stringify({
      contractVersion:'seo-brief-offline-v1',
      sourceType:'operator_supplied_offline_reports_unverified',
      technical:{status:'attention',pages:3,errors:0,warnings:1},
      organic:null,recommendedReviews:[{code:'review_page_metadata',priority:'medium',count:1}],
      rawQuery:'personal@example.com',rawFile:'/secret/private.pdf'
    }));
    const res=run('prepare-portal-handoff-offline.mjs',
      [file,'imagine-demo','a'.repeat(64),'b'.repeat(40)]);
    assert.equal(res.status,0,res.stderr);
    const result=JSON.parse(res.stdout);
    assert.equal(result.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
    assert.equal(result.customerDisplayAuthorized,false);
    assert.doesNotMatch(res.stdout,/personal@example.com|\/secret\/private.pdf/);
  });
});

test('strict public head CLI rejects missing Open Graph URL when requested',async()=>{
  await workspace(async dir=>{
    await writeFile(join(dir,'index.html'),page('/'));
    await writeFile(join(dir,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+site+'/sitemap.xml\n');
    await writeFile(join(dir,'sitemap.xml'),
      '<urlset><loc>'+site+'/</loc></urlset>');
    const normal=run('audit-dist.mjs',[dir,site+'/','--fail-on-warnings']);
    assert.equal(normal.status,0,normal.stderr);
    const strict=run('audit-dist.mjs',[dir,site+'/','--strict-public-head']);
    assert.equal(strict.status,1);
    assert.equal(JSON.parse(strict.stdout).errors.some(x=>x.type==='missing_og_url'),true);
  });
});

test('auditor CLI fails closed on typo, unexpected position and duplicate flags',async()=>{
  for(const args of [
    ['--fail-on-warning'],['dist','https://example.com/','--strict-public-headz'],
    ['dist','https://example.com/','--fail-on-warnings','--fail-on-warnings'],
    ['dist','https://example.com/','extra-file']
  ]){
    const result=run('audit-dist.mjs',args);
    assert.equal(result.status,1,args.join(' '));
    assert.match(result.stderr,/SEO audit failed:/);
    assert.equal(result.stdout,'');
  }
});
test('auditor CLI accepts flags before or after optional site origin',async()=>{
  await workspace(async dir=>{
    await writeFile(join(dir,'index.html'),page('/'));
    await writeFile(join(dir,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+site+'/sitemap.xml\n');
    await writeFile(join(dir,'sitemap.xml'),
      '<urlset><loc>'+site+'/</loc></urlset>');
    const a=run('audit-dist.mjs',['--fail-on-warnings',dir,site+'/']);
    const b=run('audit-dist.mjs',[dir,site+'/','--fail-on-warnings']);
    assert.equal(a.status,0,a.stderr);
    assert.equal(b.status,0,b.stderr);
    assert.deepEqual(JSON.parse(a.stdout).summary,JSON.parse(b.stdout).summary);
  });
});
