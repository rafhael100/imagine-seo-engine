# Imagine SEO RC55 — Nginx staging, validação real e rollback de configuração

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da RC54 [#214](https://github.com/rafhael100/imagine-seo-engine/pull/214) e F146 [#215](https://github.com/rafhael100/imagine-seo-engine/pull/215).

## Estado funcional desta linha

A linha RC55 reúne um caminho técnico de homologação de migração SEO:

1. F127/F128: manifesto estrito de URLs HTTP/www/en-us, destinos canônicos e verificação do HTML compilado.
2. F131–F137: comparação offline de páginas históricas GSC, plano 301, evidências de respostas e build estático.
3. F138–F143: coleta real de HEAD/GET via `127.0.0.1`, SHA-256 da versão do build, verificação dos bytes HTML efetivamente servidos e bloqueio de resultados incoerentes.
4. F144: execução Nginx Docker Compose isolada de CI, usuário não-root, imagem fixada por digest, mounts read-only e porta dinâmica local; cenários bons e adversariais.
5. F145: renderizador Nginx de staging diretamente do manifesto F127 já conferido com F128 e hash do build. Sem inventar redirects genéricos.
6. **F146:** ensaio de **reversão da configuração Nginx**: configuração correta → rota que serve HTML errado (bloqueada) → restauração byte-idêntica da configuração original → gate integral verde novamente.

## CI verificada antes da RC55

- RC54: **28 de 28 workflows SUCCESS** no commit `fffac6fcadf0bc7b31f33e57ae0c237f75433c28`.
- F146: **4 de 4 workflows SUCCESS** (F144, F145, F146 e suite geral), incluindo Nginx Docker real em Node 22/24 no commit `ef6b615e4316a417785f3321910b3f7e90df4682`.
- A RC55 ainda exige reexecutar a CI **na sua própria HEAD**, inventário paginado completo e revisão independente do diff antes de qualquer merge.

## Instrução operacional para homologação real

O [runbook RC54](docs/SEO-RC54-PRIVATE-NGINX-STAGING-OPERATIONAL-REVIEW.md) já contém os comandos de geração de Nginx privado, conferência do build e execução do gate completo por Codex/operador.

**Não executar diretamente na VPS sem inventário e gates**:
- confirmar acesso autorizado à Leaseweb, recursos, portas, volumes, redes, backups e reversão sem interromper CRM, Sites, Portal ou outros serviços;
- atualizar e revisar versão/CVEs do Nginx para staging, isolar a rede/egress, configurar TLS/SNI e `X-Forwarded-Proto` com uma cadeia de proxies confiável;
- homologar HTML/rotas reais, dados oficiais IBGE, conteúdo original por cidade, hreflang e canonical;
- garantir GSC com autorização, consentimento e grant por tenant do Portal — acesso por OpenSEO não substitui OAuth operacional;
- executar backup/restauração real de bancos/volumes e rollback de proxy/DNS; F146 provou apenas reversão de configuração Nginx em Docker descartável;
- revisão independente AppSec/DBA/SEO/LGPD e aceite humano de qualquer merge, DNS, publicação ou despesa.

## Decisão

**HOLD / NO-GO.** Há software e testes de CI implementados, mas ainda **não** há evidência de homologação na VPS, TLS real, Google operacional por empresa nem publicação de conteúdo real. Não alterar `main`, produção ou credenciais até concluir esses gates.
