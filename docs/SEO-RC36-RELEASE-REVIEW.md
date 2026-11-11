# Imagine SEO — RC36: consolidação offline F0–F85

**Base:** [RC35 #122](https://github.com/rafhael100/imagine-seo-engine/pull/122), CI Node22/24 aprovado. **Incremento:** [SEO-F85 #123](https://github.com/rafhael100/imagine-seo-engine/pull/123), CI Node22/24 aprovado.

## Segurança de consultas

A RC36 incorpora o filtro comum `isSensitiveGscQuery` para os dois fluxos de relatórios:
- `analyzeQueryExport`, usado nos imports manuais CSV/JSON e em comparações de períodos;
- `reviewOfflineGscQueryPageOverlap`, usado nas amostras da dimensão `query,page`.

O filtro reconhece e-mails, telefones, CPF e CNPJ formatados, com ou sem rótulos suportados. A alteração impede que um CPF `123.456.789-09` ou CNPJ `12.345.678/0001-90` sem prefixo seja contado como termo público no CSV/JSON quando o mesmo termo seria ocultado no módulo query/page. A função é heurística e pode ocultar conteúdo legítimo por excesso de zelo; **não é um detector completo de PII**.

Testes F85 com dados sintéticos confirmam consistência de contagens ocultadas, exclusão de impressões/clicks das consultas protegidas e ausência de identificadores pessoais ou URL nas respostas.

## Compatibilidade comercial

A [PR de QA Comercial #235](https://github.com/rafhael100/imagine-comercial/pull/235) validou a RC35 versus auditor F81 sobre o mesmo build Astro, com CI aprovado. Isso **não autoriza trocar o pin do Comercial para RC36**: esse upgrade precisa de prova específica da RC36 (paridade de auditor + privacidade de GSC), revisão independente e PR separada de alteração do SHA.

O Portal [#408](https://github.com/rafhael100/imagine-portal/pull/408) continua consumindo contratos SEO RC32/F79 de forma restrita em laboratório; não alterar seus pins sem testes de compatibilidade e autorização.

## Gates de liberação

- CI completa Node 22/24 da RC36.
- Revisão independente AppSec/SEO/LGPD e testes de compatibilidade autenticada no futuro Portal.
- Testes multiempresa, propriedade Google consentida, segurança OAuth, RLS, retenção e homologação de staging antes de qualquer operação real.

**NO-GO:** código em PR draft, sem merge em main, deploy, DNS/301, cobrança, chamadas Google, credenciais, autorização de clientes ou envio de dados privados.
