/**
 * SEO-F85/F89 — shared privacy classifier for user-supplied Search Console
 * queries. Conservative syntactic filter, NOT a PII proof or consent grant.
 * Returns only a boolean; never echoes the original/normalized query.
 */
const PRIVATE_GSC_QUERY=
  /@|(?:\+?\d[\d() -]{7,}\d)|(?:cpf|cnpj)\s*[:=]?\s*\d|\b\d{3}\.\d{3}\.\d{3}[- ]?\d{2}\b|\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/i;
// Unicode format controls can split a personal identifier without making
// it visually distinguishable. Apply only to an ephemeral, local string.
const INVISIBLE_CONTROLS=
  /[\u00ad\u034f\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gu;

export function isSensitiveGscQuery(value){
  if(typeof value!=='string')return false;
  // NFKC recognizes fullwidth/compatibility digits, separators and '@'.
  // Do NOT return this transformed text: privacy review is a boolean gate.
  const review=value.normalize('NFKC').replace(INVISIBLE_CONTROLS,'');
  return PRIVATE_GSC_QUERY.test(review);
}
