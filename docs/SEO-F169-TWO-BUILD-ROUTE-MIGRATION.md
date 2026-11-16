# SEO F169 — revisão de perda de rotas entre duas compilações Astro

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Complementa a [F167 #250](https://github.com/rafhael100/imagine-seo-engine/pull/250) e continua a [RC63 #254](https://github.com/rafhael100/imagine-seo-engine/pull/254).

## Problema

Dois builds podem cumprir validações individuais de HTML e até apresentar relatórios de erros estáveis enquanto uma rota pública antiga desaparece. A F169 executa a revisão de migração F22 **sobre as rotas extraídas dos dois builds reais**, não sobre inventários inventados.

## Execução

`node scripts/review-two-astro-route-migration.mjs before-dist after-dist beforeSHA40 afterSHA40 [private-candidates.json]`

O operador fornece duas revisões imutáveis distintas, pastas de build separadas e, opcionalmente, uma lista privada de candidatos de redirecionamento 301 (`{from,to}`). Um 301 indicado é apenas proposta sintática de migração, sem alterar arquivos, executar HTTP ou configurar Nginx.

A saída contém **somente contagens**: páginas antes/depois, rotas adicionadas/removidas, rotas sem candidato, candidatos mapeados e erros/avisos SEO. Nunca lista paths, consultas, tokens, texto HTML ou identificadores de cliente.

## CI integrada

A CI F167 usa os build outputs reais do Comercial F335 e F336 para executar, em sequência:
1. comparação de regressões estáticas F162/F166;
2. revisão F169 de desaparecimento de rotas sem candidatos;
3. confirmação de que os repositórios checkout não foram alterados.

A CI F169 executa testes adversariais próprios (Node 22 e 24) com builds HTML sintéticos reais; simula página removida sem 301, com 301 válido e candidato inválido, além de negar revisões idênticas e diretórios não separados.

## Limitações críticas

Mesmo um candidato 301 sintaticamente válido precisa comprovar equivalência editorial, backlinks, status HTTP legado e funcionamento real de Nginx/Cloudflare em staging, com rollback seguro. Não há DNS, indexação, publicação, ações GSC ou homologação de produção neste fluxo.

Origem IBGE oficial, GSC por tenant, revisão AppSec/LGPD, conteúdo editorial local e aprovação humana permanecem bloqueadores.
