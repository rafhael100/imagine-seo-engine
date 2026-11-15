# Imagine SEO — RC43: procedência IBGE e idiomas de build integrados

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

## Integração de duas frentes independentes

Esta branch incorpora os contratos das PRs:

- [F117 — coerência de idiomas #167](https://github.com/rafhael100/imagine-seo-engine/pull/167): cruza o locale declarado no inventário municipal com a tag raiz `html lang` do build estático, preservando hreflang, canonical, robots e sitemap.
- [F117 — captura oficial IBGE #166](https://github.com/rafhael100/imagine-seo-engine/pull/166): acessa apenas a URL HTTPS exata de municípios da API Localidades, sem redirecionamento, limita bytes e registra SHA-256 dos dados e da referência normalizada; há comando de verificação offline do recibo.

A captura foi adaptada de código já em revisão, sem alterar o fluxo de publicação. O compartilhamento do número F117 é apenas nomenclatura paralela, não sobreposição de arquivos da auditoria; a RC43 permite testar os dois recortes **juntos**.

## Verificações

- A suíte `npm test` precisa passar em Node 22 e 24, incluindo testes negativos de origem HTTPS, schema municipal e consistência do idioma.
- Um workflow separado tenta acessar o IBGE real no runner do GitHub. Falhas externas devem ser tratadas como indisponibilidade do transporte ou contrato remoto; não são aprovação silenciosa de origem.
- As verificações do Astro Comercial fixo, de hreflang e de vazamento de prévias privadas permanecem aplicáveis.
- Todas as evidências devem ser coletadas na SHA exata desta branch; resultados de uma PR de origem não substituem CI da integração.

## Limites de publicação

A existência de um recibo SHA-256 prova que a cópia local não mudou **desde que o recibo foi criado**, mas não constitui assinatura digital da edição IBGE nem comprova atendimento da Imagine em cada município. A rede HTTPS não autoriza indexação. Um idioma correto não comprova qualidade de tradução.

Permanecem bloqueados: merge, deploy, criação de páginas públicas, mudanças em `main`, exposição a clientes, autenticação OAuth/Portal real e modificações na VPS. São necessárias revisão independente, staging, LGPD/AppSec, autorização editorial, backup/rollback e aceite explícito.
