/**
 * SEO-F85 — shared privacy classifier for user-supplied Search Console queries.
 * A conservative syntactic filter, not a PII proof, consent or access grant.
 * Returns only a boolean; callers must never echo the raw query on failure.
 */
const PRIVATE_GSC_QUERY=
  /@|(?:\+?\d[\d() -]{7,}\d)|(?:cpf|cnpj)\s*[:=]?\s*\d|\b\d{3}\.\d{3}\.\d{3}[- ]?\d{2}\b|\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/i;

export function isSensitiveGscQuery(value){
  return typeof value==='string'&&PRIVATE_GSC_QUERY.test(value);
}
