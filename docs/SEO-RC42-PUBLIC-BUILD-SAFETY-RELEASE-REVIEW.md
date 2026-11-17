# Imagine SEO Engine — RC42: segurança de prévias e auditoria do build

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolidação para revisão técnica sobre `main`, não liberação para clientes.

## O que está integrado

A RC42 inclui o escopo da [RC41 #160](https://github.com/rafhael100/imagine-seo-engine/pull/160) (F107–F112 e histórico anterior), mais:

- [SEO-F113 #161](https://github.com/rafhael100/imagine-seo-engine/pull/161): marcador `imagine:editorial-preview` em prévias privadas e bloqueio `private_editorial_preview_in_public_build` no auditor de HTML real, mesmo se alguém retirar `noindex`.
- [SEO-F114 #162](https://github.com/rafhael100/imagine-seo-engine/pull/162): confronto de caminhos do inventário municipal F108 com arquivos HTML realmente compilados em diretório local; relatório sem URLs privadas; erro para páginas ausentes ou problemas técnicos.
- [SEO-F115 #163](https://github.com/rafhael100/imagine-seo-engine/pull/163): CI com versão Astro imutável do Comercial, prova de injeção de prévia privada em HTML compilado, negativa do auditor, restauração e reauditoria limpa das 45 páginas.
- [SEO-F116 #164](https://github.com/rafhael100/imagine-seo-engine/pull/164): bloqueio de gravação de prévias HTML sob `public`, `dist`, `build`, árvore Git ou pais com symlink.

Essa combinação reduz o risco de expor rascunhos e proporciona uma checagem real do build **antes do deploy**.

## Operação local de revisão (exemplo)

```bash
npm test
node scripts/review-geo-static-build-offline.mjs \
  /caminho/privado/inventory.json \
  /caminho/local/astro/dist \
  https://imaginecomunicacao.com.br/
```

O CLI F114 requer o HTML estático e o inventário municipal fornecidos pelo operador. Status 0 significa **apenas nenhuma falha identificada nas verificações offline**; não autoriza publicação, indexação, OAuth, acesso a clientes nem uso de números de conversão.

O controle F116 exige saída privada de prévias fora do repositório e fora de diretórios publicáveis. O workflow F115 só usa build descartável do commit público e fixo do Comercial, não o servidor de produção.

## Gates para transformar RC42 em release operacional

1. **Produto**: validação editorial por responsáveis e confirmação do atendimento local. Evitar páginas municipais repetitivas ou sem valor próprio.
2. **IBGE**: obtenção e comprovação da origem, integridade e abrangência da referência municipal; o importador atual não autentica sua procedência.
3. **Portal e Sites**: login/MFA efetivos, permissões por empresa/edição, aprovação editorial com trilha de auditoria e publicação reversível.
4. **Google Search Console**: OAuth real readonly, verificação independente da propriedade, tokens protegidos, consentimento e revogação.
5. **Métricas**: sessões reais de analytics e eventos CRM atribuídos — cliques/impressões GSC não equivalem a Visitas/Leads/Clientes.
6. **Infraestrutura**: staging na VPS, SSL/TLS, controles de filesystem, backup, restauração testada, observabilidade e rollback.
7. **Segurança/privacidade**: revisão independente AppSec/DBA/LGPD, testes de concorrência e prevenção de vazamento, incluindo CDN e arquivos de build.
8. **Aceite**: auditoria SEO/UX do build resultante, revisão do diff completo desta RC em relação a `main` e autorização expressa de deploy.

## Proibições mantidas

Nenhuma PR da sequência foi mesclada em `main`. Não há implantação na VPS, acesso a credenciais, conexão Google, publicação de prévias, DNS, cobrança ou exibição de dados de clientes. Os builds temporários servem exclusivamente à validação.

**Do not merge automatically; all production gates remain NO-GO.**
