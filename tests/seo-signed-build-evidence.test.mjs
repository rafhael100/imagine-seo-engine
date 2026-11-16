import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify,createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {signLocalMunicipalBuildEvidence as issue}
  from '../src/seo-signed-build-evidence.mjs';

const ORIGIN='https://imaginecomunicacao.com.br/';
const ROUTE='/servicos/site-onepage/fortaleza-ce/';
const PREFIX=Buffer.from('IMAGINE-SEO-F122-SIGNED-BUILD-REPORT\n');
const CTX={
  tenantRef:'demo-tenant',runRef:'github-actions-f122',
  engineCommitSha:'7847c8c66d5be228a08a94282da562c790cdd440'
};
function html(route,body,marker=''){
  const url=new URL(route,ORIGIN).href;
  return '<!doctype html><html lang="pt-BR"><head>'+
    '<title>Teste de assinatura original '+route+'</title>'+
    '<meta name="description" content="Página editorial original '+route+'">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+url+'">'+
    '<link rel="canonical" href="'+url+'">'+marker+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine SEO</h1>'+body+'</body></html>';
}
async function withFixture(fn,{privatePreview=false}={}){
  const root=await mkdtemp(join(tmpdir(),'seo-f121-signer-'));
  const originals={
    CI:process.env.CI,APP_ENV:process.env.APP_ENV,
    SEO_F121_SIGNER_LAB:process.env.SEO_F121_SIGNER_LAB
  };
  process.env.CI='true';
  process.env.APP_ENV='testing';
  process.env.SEO_F121_SIGNER_LAB='1';
  try{
    const folder=join(root,'servicos','site-onepage','fortaleza-ce');
    await mkdir(folder,{recursive:true});
    await writeFile(join(root,'index.html'),
      html('/','<a href="'+ROUTE+'">Site Onepage</a>'));
    const mark=privatePreview?
      '<meta name="imagine:editorial-preview" content="private-unpublished-review">':'';
    await writeFile(join(folder,'index.html'),
      html(ROUTE,'<p>Página editorial de laboratório.</p>',mark));
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+
      '<url><loc>'+ORIGIN+'</loc></url>'+
      '<url><loc>'+new URL(ROUTE,ORIGIN).href+'</loc></url></urlset>');
    const inventoryInput={
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'site-onepage',ibgeCode:'2304400',
        state:'CE',locale:'pt-BR',canonicalPath:ROUTE,
        contentSha256:createHash('sha256').update('text-only editorial demo').digest('hex')
      }]
    };
    await fn({inventoryInput,buildDirectory:root,siteUrl:ORIGIN});
  }finally{
    await rm(root,{recursive:true,force:true});
    for(const [key,value] of Object.entries(originals)){
      if(value===undefined)delete process.env[key];
      else process.env[key]=value;
    }
  }
}
function inspect(result,publicKey){
  const raw=Buffer.from(result.envelope.payloadBase64,'base64');
  const signature=Buffer.from(result.envelope.signatureBase64,'base64');
  return {
    payload:JSON.parse(raw.toString('utf8')),
    verified:verify(null,Buffer.concat([PREFIX,raw]),publicKey,signature)
  };
}
test('Engine F121 signs output computed from real local HTML, never release privileges',async()=>{
  await withFixture(async auditInput=>{
    const kp=generateKeyPairSync('ed25519');
    const now=Math.floor(Date.now()/1000);
    const signed=await issue(auditInput,CTX,kp.privateKey,now);
    const parsed=inspect(signed,kp.publicKey);
    assert.equal(parsed.verified,true);
    assert.equal(signed.reviewStatus,'human_independent_review_required');
    assert.equal(parsed.payload.issuer,'imagine-seo-engine-ci-lab');
    assert.equal(parsed.payload.tenantRef,'demo-tenant');
    assert.equal(parsed.payload.runRef,'github-actions-f122');
    assert.equal(parsed.payload.expiresAt-now,240);
    const report=JSON.parse(Buffer.from(parsed.payload.reportBase64,'base64'));
    assert.equal(report.summary.expectedRoutesFound,1);
    assert.equal(report.summary.expectedRoutesMissing,0);
    assert.equal(report.customerDisplayAuthorized,false);
    for(const flag of ['realSignerCustodyVerified','realTenantAuthenticated',
      'replayLedgerLinked','customerDisplayAuthorized','publicationAuthorized',
      'networkPerformed'])assert.equal(signed[flag],false,flag);

    const tampered=Buffer.from(JSON.stringify({...parsed.payload,
      tenantRef:'another-tenant'}));
    assert.equal(verify(null,Buffer.concat([PREFIX,tampered]),kp.publicKey,
      Buffer.from(signed.envelope.signatureBase64,'base64')),false);
    const second=await issue(auditInput,CTX,kp.privateKey,now);
    assert.notEqual(
      inspect(second,kp.publicKey).payload.nonce,parsed.payload.nonce,
      'never reuse random nonces'
    );
  });
});
test('Engine may attest a blocked build but NEVER labels it publishable',async()=>{
  await withFixture(async auditInput=>{
    const kp=generateKeyPairSync('ed25519');
    const signed=await issue(auditInput,CTX,kp.privateKey,
      Math.floor(Date.now()/1000));
    assert.equal(inspect(signed,kp.publicKey).verified,true);
    assert.equal(signed.reviewStatus,'blocked');
    assert.equal(signed.publicationAuthorized,false);
    const report=JSON.parse(Buffer.from(
      inspect(signed,kp.publicKey).payload.reportBase64,'base64'
    ));
    assert.equal(report.summary.privateEditorialPreviewLeaks,1);
  },{privatePreview:true});
});
test('F121 signing refuses non-CI or caller-controlled extra authority',async()=>{
  await withFixture(async auditInput=>{
    const kp=generateKeyPairSync('ed25519');
    const now=Math.floor(Date.now()/1000);
    await assert.rejects(issue(auditInput,{...CTX,canPublish:true},kp.privateKey,now),
      /test-only trusted signing context/);
    await assert.rejects(issue(auditInput,CTX,kp.publicKey,now),
      /test-only trusted signing context/);
    const old=process.env.SEO_F121_SIGNER_LAB;
    process.env.SEO_F121_SIGNER_LAB='0';
    try{
      await assert.rejects(issue(auditInput,CTX,kp.privateKey,now),
        /test-only trusted signing context/);
    }finally{process.env.SEO_F121_SIGNER_LAB=old;}
  });
});
