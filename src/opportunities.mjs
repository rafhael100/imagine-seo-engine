/**
 * SEO-F1: análise OFFLINE de linhas já exportadas pelo usuário do Search Console.
 * Não autentica, não acessa a API Google e não inventa rankings/volumes.
 * Não devolve termos de pesquisa brutos para reduzir vazamento de dados sensíveis.
 */
const CLUSTERS = Object.freeze([
  { id:'landing-pages', rx:/\blanding[\s-]*pages?\b|\bp[aá]gina de captura\b/ },
  { id:'sites-por-assinatura', rx:/\bsite(?:s)?\s+(?:por\s+)?assinatura\b/ },
  { id:'onepage', rx:/\bone[\s-]*pages?\b/ },
  { id:'google-ads', rx:/\bgoogle[\s-]*ads\b|\ban[uú]ncios?\s+(?:no\s+)?google\b/ },
  { id:'meta-ads', rx:/\bmeta[\s-]*ads\b|\bfacebook[\s-]*ads\b|\binstagram[\s-]*ads\b/ },
  { id:'criacao-de-sites', rx:/\bsite(?:s)?\b|\bwebsite(?:s)?\b|\bdesenvolvimento\s+web\b/ },
  { id:'seo', rx:/\bseo\b|\botimiza[cç][aã]o\s+(?:para\s+)?(?:o\s+)?google\b/ },
]);
const PRIVATE_TERM = /@|(?:\+?\d[\d() -]{7,}\d)|(?:cpf|cnpj)\s*[:=]?\s*\d/i;
const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;
function dateOk(v) {return typeof v === 'string' && VALID_DATE.test(v) && !Number.isNaN(Date.parse(v+'T00:00:00Z'));}
function normalize(value) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function clusterOf(query) {
  const phrase=normalize(query);
  for (const c of CLUSTERS) {
    // Regex contém linguagem natural e atua em string normalizada.
    if(c.rx.test(phrase)) return c.id;
  }
  return 'outros';
}
function rounded(n, digits=3) {return Math.round((n + Number.EPSILON)*10**digits)/10**digits;}

/**
 * @param {Object} report { dimensions:['query'], startDate, endDate, rows:[{keys:[query],clicks,impressions,ctr,position}] }
 */
export function analyzeQueryExport(report, {minImpressions=100}={}) {
  if (!report || typeof report!=='object' || Array.isArray(report)) throw new Error('GSC: object expected');
  if (!Array.isArray(report.dimensions) || report.dimensions.length!==1 || report.dimensions[0]!=='query') {
    throw new Error('GSC: only dimension ["query"] supported; do not guess other columns');
  }
  if (!dateOk(report.startDate) || !dateOk(report.endDate) || report.endDate<report.startDate) throw new Error('GSC: invalid reporting dates');
  if (!Array.isArray(report.rows) || report.rows.length>100000) throw new Error('GSC: invalid rows');
  if (!Number.isInteger(minImpressions) || minImpressions<1) throw new Error('GSC: invalid minimum impressions');
  const buckets=new Map();
  let redactedRows=0;
  let totalRows=0;
  let impressions=0,clicks=0;
  for (const [index,row] of report.rows.entries()) {
    if (!row || typeof row!=='object' || !Array.isArray(row.keys) || row.keys.length!==1) throw new Error('GSC: invalid query dimension at row '+index);
    const query=row.keys[0];
    if(typeof query!=='string' || query.trim().length===0 || query.length>500) throw new Error('GSC: invalid query at row '+index);
    if(!Number.isSafeInteger(row.clicks) || row.clicks<0 || !Number.isSafeInteger(row.impressions) || row.impressions<0 ||
      row.clicks>row.impressions || typeof row.ctr!=='number' || !Number.isFinite(row.ctr) || row.ctr<0 || row.ctr>1 ||
      typeof row.position!=='number' || !Number.isFinite(row.position) || row.position<1) throw new Error('GSC: invalid metrics at row '+index);
    if(row.impressions>0 && Math.abs(row.ctr-row.clicks/row.impressions)>0.02) throw new Error('GSC: inconsistent CTR at row '+index);
    totalRows++;
    if(PRIVATE_TERM.test(query)) {redactedRows++;continue;}
    const segment=/\bimagine\b/.test(normalize(query)) ? 'branded' : 'nonbranded';
    const cluster=clusterOf(query);
    const id=segment+':'+cluster;
    const prev=buckets.get(id)||{segment,cluster,rows:0,clicks:0,impressions:0,weightedPositions:0};
    prev.rows++;prev.clicks+=row.clicks;prev.impressions+=row.impressions;
    prev.weightedPositions+=row.position*row.impressions;
    buckets.set(id,prev);
    clicks+=row.clicks;impressions+=row.impressions;
  }
  const clusters=[...buckets.values()].map(v=>({
    segment:v.segment, cluster:v.cluster, rows:v.rows,
    clicks:v.clicks, impressions:v.impressions,
    ctr:v.impressions?rounded(v.clicks/v.impressions,4):0,
    averagePosition:v.impressions?rounded(v.weightedPositions/v.impressions,2):null,
    // Sinal de revisão: não é previsão nem garantia de subir posições.
    opportunity: v.impressions>=minImpressions && v.segment==='nonbranded' &&
      v.weightedPositions/v.impressions>=5 && v.weightedPositions/v.impressions<=20
      ? 'review_content_and_ctr' : null
  })).sort((a,b)=>b.impressions-a.impressions||a.cluster.localeCompare(b.cluster));
  return {
    dataSource:'user_provided_search_analytics_export_not_verified',
    period:{startDate:report.startDate,endDate:report.endDate},
    summary:{inputRows:totalRows,redactedRows,analyzedRows:totalRows-redactedRows,clicks,impressions,ctr:impressions?rounded(clicks/impressions,4):0},
    clusters,
    limitations:[
      'Search Console position is an average metric, not a guaranteed local rank.',
      'Export/API results can omit anonymized queries or be truncated; totals are limited to provided rows.',
      'CTR, impressions and average position do not establish causation or business conversions.',
      'Terms matching email/phone/identity patterns are excluded from output and totals.'
    ]
  };
}
