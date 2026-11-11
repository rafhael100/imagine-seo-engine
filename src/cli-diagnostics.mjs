/**
 * SEO-F20 — Never print arbitrary exception messages from operator inputs.
 * JSON.parse SyntaxErrors can contain raw snippets, and filesystem errors
 * may include private pathnames. Preserve only allowlisted diagnostics.
 */
export function parseSafeJson(text){
  try{return JSON.parse(text);}
  catch{throw new Error('SEO input: invalid JSON');}
}
export function safeCliDiagnostic(error){
  const msg=error?.message;
  if(typeof msg!=='string')return 'input_rejected';
  if(/^(?:SEO input|SEO brief|SEO audit gate|SEO trend|GSC|GSC CSV|SEO GSC response|SEO GSC pagination): [a-zA-Z0-9 _().,:;=/-]{1,150}$/.test(msg))
    return msg;
  return 'input_rejected';
}
