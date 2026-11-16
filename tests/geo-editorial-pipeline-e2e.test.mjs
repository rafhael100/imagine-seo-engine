import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {normalizeLocallySuppliedIbgeMunicipalities as importReference}
  from '../src/ibge-localities-offline-import.mjs';
import {prepareLocalMunicipalEditorialPreviews as render}
  from '../src/geo-editorial-html-previews.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
function rawMunicipality(id,name,uf){
  const region={id:230001,nome:'Região ilustrativa',
    'regiao-intermediaria':{
      id:2301,nome:'Região intermediária ilustrativa',
      UF:{id:uf==='CE'?23:26,nome:'UF ilustrativa',sigla:uf}
    }
  };
  return {id,nome:name,'regiao-imediata':region};
}
const reference=()=>importReference([
  rawMunicipality(2304400,'Fortaleza','CE'),
  rawMunicipality(2611606,'Recife','PE')
]);
const content='Páginas comerciais profissionais podem ser estruturadas para explicar serviços, orientar clientes e tornar o contato acessível, mas dependem de verificação da disponibilidade regional, objetivos de negócio e diferenciação editorial. '.repeat(3);
const draft=(overrides={})=>({
  serviceSlug:'site-onepage',ibgeCode:'2304400',state:'CE',
  city:'Fortaleza',availabilityConfirmed:true,
  reasonForLocalPage:'O atendimento de negócios na região requer uma proposta editorial diferenciada, dados locais conferidos e confirmação operacional dos serviços antes de eventual publicação.',
  localContent:content,demandEvidence:[{
    source:'editorial_research',observedAt:'2026-11-09',
    explanation:'Proposta editorial local sem volume de busca ou resultado comercial verificado.'
  }],...overrides
});
const full=(candidate,ref=reference())=>({
  screenInput:{
    draftBatchInput:{candidates:[candidate],existing:[],maxSimilarity:0.75},
    inventoryInput:{
      sourceType:'operator_local_inventory_unverified',
      entries:[{
        serviceSlug:'landing-pages',ibgeCode:'2611606',state:'PE',
        locale:'pt-BR',canonicalPath:'/servicos/landing-pages/recife-pe/',
        contentSha256:hash('another independent local editorial body')
      }]
    }
  },
  municipalityReference:ref
});
test('E2E from unverified IBGE-style JSON to safe private Imagine editorial HTML',()=>{
  const r=render(full(draft()));
  assert.equal(r.summary.reviewedDrafts,1);
  assert.equal(r.summary.previewsPrepared,1);
  assert.equal(r.documents[0].fileName,'draft-001.html');
  const html=r.documents[0].html;
  for(const value of [
    'noindex,nofollow,noarchive','#F9941D',
    'Site Onepage em Fortaleza, CE',
    'RASCUNHO INTERNO','Visitas → Leads → Clientes'
  ])assert.ok(html.includes(value),value);
  assert.equal(r.authenticatedReference,false);
  assert.equal(r.publicationAuthorized,false);
  assert.equal(r.indexingAuthorized,false);
  assert.equal(r.networkPerformed,false);
});
test('E2E blocks tampered municipality reference even after valid import shape',()=>{
  const officialLooking=reference();
  officialLooking.entries[0].city='Recife';
  const r=render(full(draft(),officialLooking));
  assert.equal(r.documents.length,0);
  assert.deepEqual(r.blockedIndices,[0]);
});
test('E2E blocks duplicate local landing draft already in supplied inventory',()=>{
  const x=full(draft());
  x.screenInput.inventoryInput.entries[0].serviceSlug='site-onepage';
  x.screenInput.inventoryInput.entries[0].ibgeCode='2304400';
  x.screenInput.inventoryInput.entries[0].state='CE';
  const r=render(x);
  assert.equal(r.documents.length,0);
  assert.equal(r.summary.blockedDrafts,1);
});
