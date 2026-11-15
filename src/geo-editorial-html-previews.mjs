/**
 * SEO F112 — off-network, unmounted HTML drafts for human editors.
 *
 * Takes ONLY original F110 inputs and re-evaluates quality, inventory and
 * municipality-reference gates. HTML includes locally supplied draft body;
 * NEVER send the returned documents to customers or production.
 */
import {reconcileMunicipalDraftsWithReference}
  from './geo-municipality-reference.mjs';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[ch]);

const previewHtml=(candidate,index)=>{
  const title=candidate.serviceSlug.split('-').map(x=>
    x[0]?.toLocaleUpperCase('pt-BR')+x.slice(1)).join(' ');
  const service=escapeHtml(title);
  const city=escapeHtml(candidate.city);
  const state=escapeHtml(candidate.state);
  const body=escapeHtml(candidate.localContent);
  const rationale=escapeHtml(candidate.reasonForLocalPage);
  const num=String(index+1).padStart(3,'0');
  const csp="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";
  return [
    '<!DOCTYPE html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex,nofollow,noarchive">',
    '<meta http-equiv="Content-Security-Policy" content="'+csp+'">',
    '<meta http-equiv="Cache-Control" content="no-store">',
    '<title>Prévia editorial '+num+' · Imagine SEO</title>',
    '<style>',
    ':root{color-scheme:light;--orange:#F9941D;--ink:#1e293b;--muted:#516176;--line:#dfe6ed}',
    '*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:var(--ink);font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}',
    'header{padding:28px clamp(20px,5vw,64px);background:#111d30;color:white}',
    '.logo{font-weight:900;font-size:24px;letter-spacing:-.06em}.logo span{color:var(--orange)}',
    'main{max-width:940px;padding:24px;margin:0 auto}',
    '.warning{padding:17px 20px;background:#fff4e5;border:2px solid var(--orange);border-radius:12px;font-weight:700;color:#7b4300;margin:14px 0 24px}',
    'article{padding:clamp(20px,4vw,38px);background:white;border:1px solid var(--line);border-radius:16px;box-shadow:0 6px 22px #18263c0a}',
    '.overline{font-size:12px;color:#965000;text-transform:uppercase;letter-spacing:.1em;font-weight:800}',
    'h1{font-size:clamp(26px,4vw,42px);letter-spacing:-.04em;line-height:1.2;margin:10px 0 20px}',
    'h2{font-size:19px;margin:28px 0 7px}.body{white-space:pre-wrap;overflow-wrap:anywhere}',
    'small,.caveat{color:var(--muted)}footer{margin-top:24px;color:var(--muted);font-size:13px}',
    '</style>',
    '</head>',
    '<body>',
    '<header><div class="logo">imagine<span>.</span></div><small>SEO Engine · Revisão interna</small></header>',
    '<main>',
    '<div class="warning" role="alert">RASCUNHO INTERNO — NÃO PUBLICAR NEM INDEXAR. Conteúdo e município ainda exigem aprovação editorial e verificação de fontes.</div>',
    '<article>',
    '<div class="overline">Prévia editorial '+num+' · Sem dados de clientes</div>',
    '<h1>'+service+' em '+city+', '+state+'</h1>',
    '<h2>Texto fornecido para revisão</h2>',
    '<div class="body">'+body+'</div>',
    '<h2>Justificativa editorial declarada</h2>',
    '<div class="body">'+rationale+'</div>',
    '<p class="caveat">Uma análise local não comprova demanda, serviço disponível, códigos IBGE oficiais, indexação ou resultados de busca. Visitas → Leads → Clientes depende de dados autenticados de Analytics e CRM.</p>',
    '</article>',
    '<footer>Imagine · Ambiente local privado · Sem links, scripts, formulários, canonical ou sitemap</footer>',
    '</main>',
    '</body>',
    '</html>'
  ].join('\n');
};

/** Returns private HTML documents ONLY for local editorial previews. */
export function prepareLocalMunicipalEditorialPreviews(input){
  const review=reconcileMunicipalDraftsWithReference(input);
  const drafts=input.screenInput.draftBatchInput.candidates;
  const documents=[],blockedIndices=[];
  for(const item of review.reviews){
    if(item.status!=='human_editorial_review_required'){
      blockedIndices.push(item.draftIndex);
      continue;
    }
    const fileName='draft-'+String(item.draftIndex+1).padStart(3,'0')+'.html';
    documents.push({
      draftIndex:item.draftIndex,
      fileName,
      html:previewHtml(drafts[item.draftIndex],item.draftIndex)
    });
  }
  return {
    contractVersion:'seo-municipal-private-editorial-preview-v1',
    documents,
    blockedIndices,
    summary:{
      reviewedDrafts:review.summary.reviewedDrafts,
      previewsPrepared:documents.length,
      blockedDrafts:blockedIndices.length
    },
    authenticatedReference:false,
    humanEditorialApprovalRecorded:false,
    publicHtmlGenerationAuthorized:false,
    publicationAuthorized:false,
    indexingAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_INTERNAL_EDITORIAL_REVIEW_ONLY'
  };
}
