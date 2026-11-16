# Imagine SEO RC60 — dados territoriais oficiais e integração Astro Comercial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida [RC59 #229](https://github.com/rafhael100/imagine-seo-engine/pull/229), [F156 #231](https://github.com/rafhael100/imagine-seo-engine/pull/231), [F157 #232](https://github.com/rafhael100/imagine-seo-engine/pull/232) e [F158 #234](https://github.com/rafhael100/imagine-seo-engine/pull/234). Integração corrigida no Comercial [F335 #421](https://github.com/rafhael100/imagine-comercial/pull/421).

## Entregas técnicas comprovadas

| Etapa | Avanço funcional | Evidência independente |
|---|---|---|
| RC59 | Auditorias da linha nacional, Nginx real/isolamento/rollback, dados privados, revisão de edições IBGE | 38/38 workflows padrão verdes; gate oficial de rede falhou separadamente |
| F156 | Entrada privada DTB 2025 normalizada (CSV) comparada à referência de localidades F110; bloqueia mudanças em códigos, nomes, UF e unidades especiais | 2/2 workflows verdes, Node 22/24 |
| F157 | Fonte tríplice: F117 recibo SHA → F154 cobertura F153 → F156 comparação DTB nos **mesmos bytes** do arquivo F110 | 3/3 workflows verdes, Node 22/24. Passo F154 obrigatório após sucesso da captura oficial F117 |
| F158 | CI **constrói o Astro real** da candidata Comercial F335 (SHA exata `c33008d335901ba8aa1f5455f681bc4df13f45d7`), roda testes nativos, `check:dist` e auditor SEO no HTML gerado PT/EN/ES; verifica calculadora e CTA anônimo | 2/2 workflows verdes na HEAD SEO `8aa107cd330e9699238ca7feaf79be2cce109c09` |
| Comercial F335 | Corrige contrato de fragmento `/contato/#briefing:~:~:~:contatos` descoberto pelo teste real F158. Aceita somente estado canônico do codec público existente, não campos livres ou PII | Build/testes comprovados pelo workflow integrado F158 |

### Por que essa entrega é diferente de outro mock

A F158 já não testa apenas dados fabricados do Engine. Ela obtém código Astro da **candidata comercial verdadeira fixada por commit**, compila o site inteiro e audita páginas HTML resultantes, links, hreflang, sitemap, robots, metadados e a calculadora localizada. O primeiro ensaio falhou com erro real F143 de fragmento; a correção F335 foi testada e passou em uma segunda execução.

Isso **não equivale a homologação em produção**: o checkout comercial está em DRAFT; o Nginx real de CI serve um build sintético distinto, e não há URL comercial implantada pelo SEO nesta RC.

## Bloqueadores objetivos para colocar em operação

1. **Proveniência IBGE — ISSUE #230:** o job HTTPS oficial F120 executado em 16/11/2026 retornou `official_source_transport_unavailable`. O código F156/F157 existe para comparar uma tabela DTB obtida diretamente do IBGE por operador confiável, com o diretório de localidades F110 e recibo F117, mas **a tabela original e seu digest não foram autenticados nesta execução**. Não confundir esses testes com a base nacional real aprovada.
2. **Revisão do diff e da cadeia de CI:** todas as entregas estão em PRs acumuladas e publicamente inspecionáveis; exigir validação na SHA final RC60, revisão dos workflows/segredos, dependências, parâmetros e compatibilidade entre repositórios antes de mesclar. Não atualizar automaticamente a referência Comercial F335 para HEAD móvel.
3. **Conteúdo editorial com atendimento real:** os templates de páginas municipais e idiomas PT/EN/ES têm gates, mas textos, valor local, atendimento, canonical/hreflang e exceções territoriais exigem validação humana. Evitar páginas doorway e material sintético para indexação.
4. **Staging Leaseweb real:** código F147–F152 já protege inventário Docker, geração de Compose, Nginx e rollback em CI. Ainda faltam identificação autenticada do host, inventário de portas/rede/CPU/memória, imagem Docker/CVEs, firewall egress, backup/restore e teste de rollback **na VPS correta**, sem afetar CRM, Sites e Portal.
5. **GSC e Portal:** autorização Google real por propriedade e tenant, RBAC/MFA, conteúdo aprovado, coleta LGPD e integração com o site comercial exigem credenciais autorizadas e ambiente real; o Engine não deve inventá-las.
6. **Aceite humano de release:** nada em F156–F158 autoriza merge, mudança DNS, publicação no Cloudflare, cobrança, escrita Google Ads ou envio de leads.

## Ordem de trabalho recomendada ao Codex/operador

- Inspecionar [RC60] e seus PRs, congelar SHA e validar todos os jobs de CI na SHA exata. Avaliar especialmente `src/ibge-*`, `scripts/review-ibge-*`, `labs/`, workflow F120 e novo F158.
- Usar a [DTB 2025 oficial](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/23701-divisao-territorialbrasileira), arquivar XLS/ODS original com URL e SHA, preparar CSV **privado** de três colunas conforme F156 sem alterar geocódigos.
- Obter referência de localidades por fonte oficial comprovada e preservar recibo/identidade independente; executar offline:

```bash
node scripts/review-independent-dtb-reference-offline.mjs \
 /AREA-PRIVADA/localidades-f110.json \
 /AREA-PRIVADA/dtb-2025-municipios-normalizado.csv

node scripts/review-ibge-three-source-offline.mjs \
 /AREA-PRIVADA/localidades-f110.json \
 /AREA-PRIVADA/recibo-f117.json \
 /AREA-PRIVADA/dtb-2025-municipios-normalizado.csv
```

- Corrigir somente entradas/bloqueios reais identificados. Não produzir uma falsa assinatura ou "completar" geocódigos não encontrados.
- Conferir nova SHA da branch Comercial F335 antes da integração. Repetir build/testes/Playwright e os gates SEO da F158 quando houver mudança relevante de código.
- Homologar staging Docker privado na Leaseweb conforme RC56/RC57 após inventário autorizado, backups, revisão de segurança e plano de rollback. Não alterar contêineres pré-existentes.
- Reunir relatório de evidências *sanitizado* e obter decisão GO separada para cada etapa de publicação.

## Regras permanentes

Mesmo todos os testes verdes representam apenas progresso verificável de engenharia. A RC60 continua em **HOLD** para dados oficiais não autenticados, integração GSC/propriedade e VPS. Não houve merge para `main`, deploy, DNS, publicação pública, cobrança, operação com cliente nem acesso produtivo a Portal/CRM/Sites.
