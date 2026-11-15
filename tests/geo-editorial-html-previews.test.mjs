import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareLocalMunicipalEditorialPreviews as prepare}
  from '../src/geo-editorial-html-previews.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
const text='A análise local procura entender necessidades de empresas para apresentar serviços digitais de maneira clara, com informações sobre atendimento, benefícios comerciais legítimos, acessibilidade e navegação. '.repeat(3);
const candidate=(extra={})=>({
  serviceSlug:'site-onepage',ibgeCode:'2304400',
  state:'CE',city:'Fortaleza',availabilityConfirmed:true,
  reasonForLocalPage:'Os serviços de comunicação digital precisam de avaliação editorial local, com validação da equipe que presta atendimento e dos fatos apresentados.',
  localContent:text,...{
    demandEvidence:[{
      source:'editorial_research',observedAt:'2026-11-09',
      explanation:'Revisão editorial humana sem garantia de resultados de busca.'
    }]
  },...extra
});
const original=(candidates=[candidate()])=>({
  screenInput:{
    draftBatchInput:{candidates,existing:[],maxSimilarity:0.75},
    inventoryInput:{
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'landing-pages',ibgeCode:'2611606',state:'PE',
        locale:'pt-BR',canonicalPath:'/servicos/landing-pages/recife-pe/',
        contentSha256:hash('unrelated editorial content')
      }]
    }
  },
  municipalityReference:{
    sourceType:'operator_supplied_municipality_reference_unverified',
    entries:[
      {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
      {ibgeCode:'2611606',state:'PE',city:'Recife'}
    ]
  }
});
test('human-review draft produces local noindex preview with Imagine orange',()=>{
  const r=prepare(original());
  assert.equal(r.contractVersion,'seo-municipal-private-editorial-preview-v1');
  assert.equal(r.summary.previewsPrepared,1);
  assert.equal(r.summary.blockedDrafts,0);
  assert.equal(r.documents[0].fileName,'draft-001.html');
  const html=r.documents[0].html;
  for(const v of [
    '<html lang="pt-BR">',
    'noindex,nofollow,noarchive',
    '#F9941D','RASCUNHO INTERNO',
    'Site Onepage em Fortaleza, CE',
    'Visitas → Leads → Clientes',
    'Revisão interna'
  ])assert.ok(html.includes(v),v);
  for(const forbidden of [
    '<script','<form','<a href=','rel="canonical"',
    'https://','<iframe'
  ])assert.ok(!html.includes(forbidden),forbidden);
  for(const flag of [
    'authenticatedReference','humanEditorialApprovalRecorded',
    'publicHtmlGenerationAuthorized','publicationAuthorized',
    'indexingAuthorized','networkPerformed'
  ])assert.equal(r[flag],false,flag);
});
test('HTML-escapes untrusted editorial content without executing markup',()=>{
  const attack='<img src=x onerror=alert("SECRET_TOKEN")>';
  const x=prepare(original([candidate({
    localContent:text+' '+attack,
    reasonForLocalPage:'Uma avaliação contextual do serviço requer auditoria. '+attack
  })]));
  assert.equal(x.documents.length,1);
  const html=x.documents[0].html;
  assert.ok(html.includes('&lt;img src=x onerror=alert(&quot;SECRET_TOKEN&quot;)&gt;'));
  assert.ok(!html.includes(attack));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('default-src'));
});
test('blocked or wrong municipality drafts produce no private HTML',()=>{
  const blocked=prepare(original([candidate({
    state:'PE',city:'Fortaleza'
  })]));
  assert.equal(blocked.summary.blockedDrafts,1);
  assert.deepEqual(blocked.blockedIndices,[0]);
  assert.deepEqual(blocked.documents,[]);
  const denied=prepare(original([candidate({
    localContent:text+' pessoal@exemplo.test'
  })]));
  assert.equal(denied.documents.length,0);
});
test('multiple candidates keep generated names ordinal, not derived from URLs',()=>{
  const second=candidate({
    serviceSlug:'landing-pages',ibgeCode:'2611606',
    state:'PE',city:'Recife',
    localContent:'Outro texto contextualizado com abordagem diferente. '.repeat(9),
    reasonForLocalPage:'Avaliação comercial específica com confirmação de atendimento e revisão de conteúdo para o público da região de Recife.'
  });
  // Inventory already contains the Recife landing-pages identity, so
  // only the first candidate is allowed a private preview.
  const r=prepare(original([candidate(),second]));
  assert.equal(r.summary.reviewedDrafts,2);
  assert.equal(r.summary.previewsPrepared,1);
  assert.deepEqual(r.documents.map(x=>x.fileName),['draft-001.html']);
  assert.deepEqual(r.blockedIndices,[1]);
});
test('caller-supplied approvals and incomplete reference cannot bypass F110',()=>{
  const x=original();
  x.publicationAuthorized=true;
  assert.throws(()=>prepare(x),/SEO F110/);
  const y=original();y.municipalityReference.entries=[];
  assert.throws(()=>prepare(y),/SEO F110/);
});
