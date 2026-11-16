import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,verify} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {signMultilingualBuildEvidence,MULTILINGUAL_PREFIX} from
  '../src/seo-signed-multilingual-evidence-v2.mjs';

const origin='https://imaginecomunicacao.com.br/';
const languages=[
  ['pt-BR','pt-BR','/servicos/site-onepage/fortaleza-ce/'],
  ['en-US','en','/en/sites/onepage/fortaleza/'],
  ['es-ES','es','/es/sitios/onepage/fortaleza/']
];
const ctx={tenantRef:'demo-tenant',runRef:'github-actions-f126',
  engineCommitSha:'1f11919f25122f19c0bd678ec2124b23fe47b80a'};
function html(path,lang,body,alts=''){
  const url=new URL(path,origin).href;
  return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8">'+
    '<title>Original SEO editorial '+lang+' '+path+'</title>'+
    '<meta name="description" content="Professional service in '+lang+' for '+path+'">'+
    '<meta name="robots" content="index,follow">'+
    '<meta property="og:url" content="'+url+'">'+
    '<link rel="canonical" href="'+url+'">'+alts+
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
    '</head><body><h1>Imagine professional services</h1>'+body+'</body></html>';
}
async function fixture(run,{missingHreflang=false}={}){
  const root=await mkdtemp(join(tmpdir(),'seo-f126-'));
  const before={CI:process.env.CI,APP_ENV:process.env.APP_ENV,
    SEO_F126_SIGNER_LAB:process.env.SEO_F126_SIGNER_LAB};
  process.env.CI='true';process.env.APP_ENV='testing';
  process.env.SEO_F126_SIGNER_LAB='1';
  try{
    const alts=languages.map(([,lang,path])=>
      '<link rel="alternate" hreflang="'+lang+'" href="'+new URL(path,origin).href+'">'
    ).join('');
    await writeFile(join(root,'index.html'),
      html('/','pt-BR',languages.map(x=>'<a href="'+x[2]+'">See service</a>').join('')));
    await writeFile(join(root,'robots.txt'),
      'User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
    await writeFile(join(root,'sitemap.xml'),'<urlset>'+
      ['/',...languages.map(x=>x[2])].map(path=>
        '<url><loc>'+new URL(path,origin).href+'</loc></url>').join('')+'</urlset>');
    for(const [locale,lang,path] of languages){
      const folder=join(root,...path.split('/').filter(Boolean));
      await mkdir(folder,{recursive:true});
      await writeFile(join(folder,'index.html'),
        html(path,lang,'Unique marketing page '+locale,missingHreflang?'':alts));
    }
    const inventoryInput={
      sourceType:'operator_local_inventory_unverified',
      entries:languages.map(([locale,,path])=>({
        serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
        locale,canonicalPath:path,
        contentSha256:createHash('sha256').update('unique page '+locale).digest('hex')
      }))
    };
    await run({inventoryInput,buildDirectory:root,siteUrl:origin});
  }finally{
    for(const [key,value] of Object.entries(before))
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    await rm(root,{force:true,recursive:true});
  }
}
function inspect(output,key){
 const raw=Buffer.from(output.envelope.payloadBase64,'base64');
 const signature=Buffer.from(output.envelope.signatureBase64,'base64');
 const payload=JSON.parse(raw.toString('utf8'));
 return {
   payload,
   report:JSON.parse(Buffer.from(payload.reportBase64,'base64').toString('utf8')),
   verified:verify(null,Buffer.concat([MULTILINGUAL_PREFIX,raw]),key,signature)
 };
}
test('F126 signs real PT/EN/ES compiled audit with a distinct v2 contract',async()=>{
 await fixture(async input=>{
   const keys=generateKeyPairSync('ed25519'),now=Math.floor(Date.now()/1000);
   const issued=await signMultilingualBuildEvidence(input,ctx,keys.privateKey,now);
   const inspected=inspect(issued,keys.publicKey);
   assert.equal(inspected.verified,true);
   assert.equal(issued.envelope.contractVersion,'seo-f126-signed-multilingual-review-v2');
   assert.equal(inspected.payload.issuer,'imagine-seo-engine-f126-ci-lab');
   assert.equal(inspected.payload.audience,'imagine-portal-f126-ci-lab');
   assert.equal(inspected.payload.expiresAt-now,240);
   assert.equal(inspected.payload.engineCommitSha,ctx.engineCommitSha);
   assert.equal(inspected.report.contractVersion,'seo-municipal-multilingual-review-dto-v2');
   assert.equal(inspected.report.reviewStatus,'human_independent_review_required');
   assert.equal(inspected.report.summary.inspectedEntries,3);
   assert.equal(inspected.report.summary.missingHreflangLinks,0);
   assert.equal(inspected.report.summary.auditedBuildPages,4);
   assert.equal(inspected.report.hreflangReviewStatus,'human_independent_review_required');
   assert.equal(inspected.report.publicationAuthorized,false);
   for(const token of ['fortaleza-ce','site-onepage','2304400',origin])
     assert.equal(JSON.stringify(inspected.report).includes(token),false,token);
   for(const k of ['realTenantAuthenticated','trustedProductionSignerVerified',
     'replayLedgerLinked','publicationAuthorized','customerDisplayAuthorized',
     'networkPerformed'])assert.equal(issued[k],false,k);
   const different=await signMultilingualBuildEvidence(input,ctx,keys.privateKey,now);
   assert.notEqual(inspect(different,keys.publicKey).payload.nonce,
     inspected.payload.nonce);
 });
});
test('F126 signs blocked status honestly without permission to publish',async()=>{
 await fixture(async input=>{
   const keys=generateKeyPairSync('ed25519');
   const issued=await signMultilingualBuildEvidence(
     input,ctx,keys.privateKey,Math.floor(Date.now()/1000));
   const result=inspect(issued,keys.publicKey);
   assert.equal(result.verified,true);
   assert.equal(issued.reviewStatus,'blocked');
   assert.equal(result.report.reviewStatus,'blocked');
   assert.equal(result.report.summary.missingHreflangLinks,9);
   assert.equal(result.report.publicationAuthorized,false);
 },{missingHreflang:true});
});
test('F126 signature cannot be replayed under different bytes, key, or domain',async()=>{
 await fixture(async input=>{
   const keys=generateKeyPairSync('ed25519'),other=generateKeyPairSync('ed25519');
   const issued=await signMultilingualBuildEvidence(
     input,ctx,keys.privateKey,Math.floor(Date.now()/1000));
   const raw=Buffer.from(issued.envelope.payloadBase64,'base64');
   const signature=Buffer.from(issued.envelope.signatureBase64,'base64');
   assert.equal(verify(null,Buffer.concat([MULTILINGUAL_PREFIX,raw]),
      other.publicKey,signature),false);
   assert.equal(verify(null,Buffer.concat([
      Buffer.from('IMAGINE-SEO-F122-SIGNED-BUILD-REPORT\n'),raw
   ]),keys.publicKey,signature),false);
   const changed=Buffer.from(JSON.stringify({
     ...JSON.parse(raw.toString('utf8')),tenantRef:'other-tenant'
   }));
   assert.equal(verify(null,Buffer.concat([MULTILINGUAL_PREFIX,changed]),
      keys.publicKey,signature),false);
 });
});
test('F126 refuses non-CI, untrusted tenant or wrong key type',async()=>{
 await fixture(async input=>{
   const keys=generateKeyPairSync('ed25519'),now=Math.floor(Date.now()/1000);
   await assert.rejects(
      signMultilingualBuildEvidence(input,{...ctx,publicationAllowed:true},
        keys.privateKey,now),/trusted CI-only/);
   await assert.rejects(
      signMultilingualBuildEvidence(input,ctx,keys.publicKey,now),/trusted CI-only/);
   const saved=process.env.SEO_F126_SIGNER_LAB;
   process.env.SEO_F126_SIGNER_LAB='0';
   try{
     await assert.rejects(signMultilingualBuildEvidence(input,ctx,keys.privateKey,now),
       /trusted CI-only/);
   }finally{process.env.SEO_F126_SIGNER_LAB=saved;}
 });
});
