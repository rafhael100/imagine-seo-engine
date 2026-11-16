# SEO-F99 — Auditoria offline de idioma HTML (PT / EN / ES)

## Objetivo

Compatibilidade com a futura navegação multilíngue do Imagine Comercial:
português brasileiro, inglês e espanhol; as bandeiras dos Estados Unidos e da Espanha são elementos visuais, não códigos obrigatoriamente regionais de HTML.
**Nenhuma tradução, troca de idioma ou publicação é implementada aqui.**

## Regras

- Padrão conservador: sem flag, o auditor continua exigindo exatamente um
  `<html lang="pt-BR">` e mantém o diagnóstico histórico
  `missing_ptbr_lang` para builds legados.
- `node scripts/audit-dist.mjs dist https://imaginecomunicacao.com.br/ --multilingual --fail-on-warnings`
  habilita somente `pt-BR`, `en`, `es`, `en-US` e `es-ES` no atributo `lang` da raiz. O Imagine Comercial #383 usa os códigos genéricos `en` e `es` em seus documentos; as variantes regionais continuam aceitas para compatibilidade futura.
- Uma tag raiz sem `lang`, com dois atributos `lang` ou com idioma fora da
  lista gera o warning `invalid_root_lang`. O `--fail-on-warnings` faz o
  comando sair com código 1 nesse caso.
- O verificador considera apenas `<html>` real, não marcas em comentários,
  scripts, corpo ou templates inertes. Comparação de códigos ignora caixa;
  a opção programática `allowedLanguages` exige array explícito sem valores
  repetidos e pertencentes à lista aprovada.
- Limites de crawl, head/canonical, sitemap e segurança preexistentes não são
  enfraquecidos pelo modo multilíngue.

## Limites importantes

A F99 valida **apenas o valor declarado na raiz HTML**, não verifica se o texto
foi traduzido, a presença de seletor com bandeiras, a correspondência entre
`/en/`, `/es/` e o idioma, reciprocidade de `hreflang`, `x-default`,
conteúdo duplicado multilíngue, métricas do Google nem qualidade editorial.
Esses itens precisam de critérios e testes separados com o site Comercial.
A lista de três idiomas não deve ser entendida como autorização para gerar
páginas de municípios em massa sem conteúdo original e revisão humana.

## Validação e gates

`npm test` e GitHub Actions em Node 22/24 precisam passar na HEAD exata.
A entrega permanece em DRAFT, sem merge em main, atualização do pin do
Comercial, deploy, DNS, 301, OAuth, leitura ao vivo de GSC ou dados reais.
Revisões editoriais, técnicas e de segurança e CI de compatibilidade com o
Imagine Comercial continuam pendentes.
