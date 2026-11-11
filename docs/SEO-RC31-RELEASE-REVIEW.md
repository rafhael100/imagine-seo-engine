# SEO Offline RC31 — revisão F0–F76

## Escopo incremental sobre RC30

| ID | Entrega | PR |
| --- | --- | --- |
| F73 | CLI privada de validação de lotes query/page vinculados ao plano F71/F72 | #106 |
| F74 | Handoff de revisão do Portal com contagens derivadas das respostas originais, sem termos/URLs | #107 |
| F75 | CLI privada do envelope de revisão para o Portal | #108 |
| F76 | Leitor local com UTF-8 estrito e rejeição de bytes malformados | #109 |

## Gates de qualidade e segurança

- Validar CI Node 22/24 da própria RC31 e resultados das PRs de feature. Não inferir aprovação de release somente dos testes de feature.
- Testes de privacidade: saída sem termo de busca, URL, token, nome de arquivo ou mensagem de erro não sanitizada. Entradas artificiais e segredos fictícios somente.
- Confirmar que os contratos seguem **não autenticados**: tenantRef/fingerprint/commit SHA não são identidade, consentimento, credenciais ou verificação de propriedade.
- `HOLD_EXTERNAL_AUTHORIZATION`: qualquer relatório ao Portal exige MFA/RBAC, concessão explícita por tenant, autorização Google real, política LGPD de retenção/exclusão, auditoria, criptografia de segredo e revisão independente.
- O código offline não executa HTTP, OAuth, deploy, alteração de DNS/301, criação em massa de páginas ou publicação automática; nenhum segredo/dado real em Git/CI.
- A promoção de consumidores dos novos contratos é opt-in, com pin de SHA e homologação própria. Não fazer merge `main` nem deploy nesta rodada.

## Critérios de liberação da RC31

1. Workflow offline de RC31 com sucesso em Node 22 e 24.
2. Revisão externa independente de segurança/AppSec e privacidade/LGPD.
3. Homologação autenticada no backend do Imagine Portal, com consentimento e grants reais e evidência de acesso à propriedade Search Console.
4. Aceitação controlada da integração em ambiente de homologação antes de qualquer produção.

**Estado:** `DRAFT — HOLD_EXTERNAL_AUTHORIZATION`. Sem promessa de tráfego, ranking, canibalização provada ou acesso ao Google.
