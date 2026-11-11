# Imagine SEO RC35 — Consolidação F0–F84

**Base da candidata:** [RC34 #118](https://github.com/rafhael100/imagine-seo-engine/pull/118). **Três incrementos de integridade GSC:**

- [SEO-F82 #119](https://github.com/rafhael100/imagine-seo-engine/pull/119): quatro CLIs de importação/comparação de CSV e JSON rejeitam flags e argumentos excedentes com `Usage` (exit 2) antes de ler evidências privadas. CI Node22/24 aprovado.
- [SEO-F83 #120](https://github.com/rafhael100/imagine-seo-engine/pull/120): exportações com dimensão única `query` rejeitam **consultas exatamente duplicadas** em CSV, JSON e comparação de períodos, sem somá-las duas vezes ou vazar termos pessoais. Mantém consultas com capitalização distinta como entradas distintas. CI Node22/24 aprovado.
- [SEO-F84 #121](https://github.com/rafhael100/imagine-seo-engine/pull/121): delimitador CSV escolhido **somente pelo cabeçalho** com quebras LF/CRLF/CR, evitando que `;` em consulta privada de arquivo CR-only altere a leitura. Testes PT-BR/EN e dados pessoais fictícios, CI Node22/24 aprovado.

## Consumidores e prioridades

A [PR #234 do Imagine Comercial](https://github.com/rafhael100/imagine-comercial/pull/234) segue **pinada no SHA auditado SEO-F81 `10a649f9c448fe8412da6e8c499eec0637d9259e`**, já testado no build real do site com CI aprovado. **Não alterar esse pin automaticamente para a RC35**: as mudanças F82–F84 exigem atualização e homologação próprias na cadeia de integração do Comercial.

A candidata de integração [Portal #408](https://github.com/rafhael100/imagine-portal/pull/408) continua testando o contrato estável SEO RC32 e modelo F79 por SHAs imutáveis, não o backend Google real.

## Gates

- RC35 deve passar suíte total em Node 22 e 24, incluindo os testes dos incrementos e regressões históricas.
- A revisão independente AppSec/LGPD/SEO e a validação de contrato com consumidores continuam pendentes; o número F84 não é percentual de conclusão SaaS.
- Nenhum consentimento de propriedade Google, OAuth real, credencial, sessão MFA, grant por tenant, banco, DNS, 301, publicação, deploy, pagamento ou merge em `main` ocorreu.

**Status: DRAFT/NO-GO.** Os módulos são offline e não atestam dados de tráfego verdadeiro.
