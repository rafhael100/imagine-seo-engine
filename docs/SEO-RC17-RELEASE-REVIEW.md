# Release candidate RC17 — Imagine SEO Engine

Data da consolidação: 11/11/2026.

Base funcional: RC16 (F0–F42), seguida pelos controles F43–F49:
- F43: inventário de propriedades GSC restrito a campos conhecidos.
- F44: resposta GSC de página única com formato fechado.
- F45: metadados finais sem marcadores de incompletude.
- F46: plano GSC sem parâmetros extras de entrada.
- F47: entradas do planejador GSC com dados próprios.
- F48: agregação de páginas GSC com envelopes e metadados estritos.
- F49: preflight e planos GSC com registros próprios e formato fechado.

Verificações na base de desenvolvimento: F46 CI https://github.com/rafhael100/imagine-seo-engine/actions/runs/42942660944; F47 CI https://github.com/rafhael100/imagine-seo-engine/actions/runs/42945068063; F48 CI https://github.com/rafhael100/imagine-seo-engine/actions/runs/42946540069; F49 CI https://github.com/rafhael100/imagine-seo-engine/actions/runs/42946710352.

Ensaio cruzado no Imagine Comercial: PR https://github.com/rafhael100/imagine-comercial/pull/125 com pin imutável da F49. Não declarar integração aprovada antes de seus pipelines terminarem com sucesso.

**Gate de liberação: HOLD.** Esta candidata ainda não está revisada independentemente; não houve merge em `main`, implantação, OAuth, leitura real de Google, acesso a dados de clientes, configuração de DNS, redirects 301 ou gasto adicional. A identidade da propriedade no GSC, consentimento, autenticação multiempresa, isolamento do Portal e testes autenticados em staging continuam condições de produção.
