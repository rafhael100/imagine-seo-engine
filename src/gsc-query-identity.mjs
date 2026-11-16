/**
 * F90 — Ephemeral identity for duplicate search-query checks (offline).
 * This value MUST remain in a local Set; never place normalized or raw
 * queries in diagnostics, reports, handoffs, logs or persisted records.
 * Conservative equivalence is intentional: ambiguous totals fail closed.
 */
const INVISIBLE_FORMAT_CONTROLS=
  /[\u00ad\u034f\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gu;
export function gscQueryIdentity(query){
  if(typeof query!=='string')throw Error('GSC: invalid query type');
  return query.normalize('NFKC').replace(INVISIBLE_FORMAT_CONTROLS,'')
    .trim().toLocaleLowerCase('pt-BR');
}
