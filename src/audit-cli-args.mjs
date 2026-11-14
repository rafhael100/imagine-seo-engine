/** SEO-F29: reject misspelled or duplicate CLI flags instead of silently disabling gates. */
const KNOWN=new Set(['--fail-on-warnings','--strict-public-head','--multilingual','--check-hreflang']);
export function parseStaticAuditCliArgs(args){
  if(!Array.isArray(args)||args.length>6||args.some(x=>typeof x!=='string'||!x))
    throw Error('SEO audit CLI: invalid arguments');
  const flags=new Set(),positional=[];
  for(const value of args){
    if(value.startsWith('-')){
      if(!KNOWN.has(value)||flags.has(value))
        throw Error('SEO audit CLI: unrecognized or duplicate option');
      flags.add(value);
    }else{
      if(positional.length>=2)throw Error('SEO audit CLI: too many positional arguments');
      positional.push(value);
    }
  }
  if(flags.has('--check-hreflang')&&!flags.has('--multilingual'))
    throw Error('SEO audit CLI: hreflang check requires multilingual mode');
  return {
    target:positional[0]??'dist',
    siteUrl:positional[1]??'https://imaginecomunicacao.com.br/',
    strict:flags.has('--fail-on-warnings'),
    strictPublicHead:flags.has('--strict-public-head'),
    allowedLanguages:flags.has('--multilingual')?['pt-BR','en','es','en-US','es-ES']:['pt-BR'],
    checkHreflang:flags.has('--check-hreflang')
  };
}
