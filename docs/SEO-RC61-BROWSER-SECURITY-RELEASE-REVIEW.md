# Imagine SEO RC61 — integração e revisão consolidada

**STATUS: DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

Esta candidata continua a [RC60 #235](https://github.com/rafhael100/imagine-seo-engine/pull/235), sem perder a história e os controles. O propósito é revisar uma só árvore integrada em vez de interpretar a CI de PRs independentes como um release pronto.

## Entregas acumuladas nesta cadeia

| Entrega | Origem | Evidência existente |
|---|---|---|
| F159 Chromium real sobre o Astro Comercial | SEO [#237](https://github.com/rafhael100/imagine-seo-engine/pull/237) | SEO F159, F158 e validação offline SUCCESS na HEAD da F159 |
| Correção de fragmento do Chromium | Comercial [#423](https://github.com/rafhael100/imagine-comercial/pull/423) | testes Comercial, PostgreSQL, SEO F158/F159 SUCCESS na SHA fixada |
| F160 inventário cumulativo de mudanças | SEO [#240](https://github.com/rafhael100/imagine-seo-engine/pull/240) | 530 arquivos classificados, 109 caminhos prioritários, CI verde |
| F161 cadeia de workflows | SEO [#241](https://github.com/rafhael100/imagine-seo-engine/pull/241) | 44 workflows / 94 action refs; zero achados nas regras iniciais |
| F162 inventário privado de nove evidências de release | SEO [#242](https://github.com/rafhael100/imagine-seo-engine/pull/242) | exigência de SHA comum, hash único por gate, origem declarativa e HOLD |
| F163 endurecimento para YAML compacto | SEO [#243](https://github.com/rafhael100/imagine-seo-engine/pull/243) | CI final SUCCESS; evita bypass de permissões e eventos compactos |
| F164 paridade da SHA Comercial entre Astro/Chromium | SEO [#245](https://github.com/rafhael100/imagine-seo-engine/pull/245) | CI final SUCCESS, SHA imutável idêntica em ambas as suítes |

As PRs independentes SEO [#238](https://github.com/rafhael100/imagine-seo-engine/pull/238) e [#239](https://github.com/rafhael100/imagine-seo-engine/pull/239) não foram incorporadas automaticamente. Exigem análise comparativa e compatibilidade antes de integrar.

## Verificações obrigatórias na própria RC61

1. Executar a CI integral sobre a SHA final desta PR e revisar todas as falhas, avisos e workflows não disparados. Nenhum resultado de uma branch de origem equivale a aprovação da RC61.
2. Inventariar o diff cumulativo em páginas e revisar sobretudo workflows/dependências, segurança, identidade, infraestrutura e dados territoriais, com revisão independente.
3. Confirmar vínculo imutável da versão Comercial F336; executar Astro F158 e Chromium F159 na mesma SHA, inclusive cálculos hipotéticos do funil PT/EN/ES.
4. Validar origem territorial IBGE 2025/DTB independente, hash do binário oficial, cobertura F153–F157, aprovação editorial por cidade e prevenção de doorway pages. Bloqueio [#230](https://github.com/rafhael100/imagine-seo-engine/issues/230) permanece.
5. Comprovar consentimento, RBAC, acesso GSC/GA4 por tenant e integração operacional com Portal/CRM sem inventar métricas ou confundir clicks GSC com visitas.
6. Fazer inventário e staging isolado e autorizado na Leaseweb, backups, restauração, rollback, TLS, limites Docker e revisão AppSec antes de qualquer alteração real.
7. Obter revisão humana de conteúdo, segurança, LGPD e decisão explícita GO em etapa separada. O contrato F162 jamais concede GO automaticamente.

## Integridade e limites

Os resultados são controles e evidências de engenharia, não prova de conexão real de Google/IBGE, homologação da VPS ou aprovação editorial de todas as localidades. Nenhuma etapa da RC61 deve realizar merge, publicação, DNS, indexação, mudança de tráfego, cobrança ou contato com clientes.

**Decisão atual: HOLD**, aguardando os gates operacionais e as revisões externas documentadas.
