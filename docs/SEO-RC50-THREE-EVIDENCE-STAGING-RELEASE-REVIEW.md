# Imagine SEO RC50 — revisão consolidada GSC / HTTP 301 / HTML estático

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolidação de [RC49 #194](https://github.com/rafhael100/imagine-seo-engine/pull/194) e [F134 #195](https://github.com/rafhael100/imagine-seo-engine/pull/195), [F135 #196](https://github.com/rafhael100/imagine-seo-engine/pull/196), [F136 #197](https://github.com/rafhael100/imagine-seo-engine/pull/197), [F137 #198](https://github.com/rafhael100/imagine-seo-engine/pull/198).

## O que já existe na linha técnica

- Auditoria SEO HTML local, canonical, sitemap, robots, prévias privadas, idiomas PT-BR/EN-US/ES-ES e clusters hreflang.
- Contrato de evidência Ed25519 v2 para relatório multilíngue, interoperável **em laboratório** com o Portal RC50/SEO F138–F140, sem substituir a assinatura v1.
- Inventário de origem municipal e IBGE com gates oficiais ainda exigidos, sem geração automática de páginas doorway.
- F127–F129 verificam planejamento de redirects HTTP/www/en-us contra HTML compilado, com CLI privada.
- F130 evita confundir GA4 visitas, leads confirmados pelo CRM e clientes reais, sem ativação de eventos.
- F131–F133 analisam linhas GSC por página **fornecidas offline** e exigem cobertura por um plano 301 revisado; dados reais não são versionados.
- F134–F135 validam recibos HTTP 301 **fornecidos pelo operador** contra destinos, códigos e hops; não realizam requisições.
- F136–F137 compõem os três eixos **GSC histórico + HTTP 301 capturado + HTML compilado real** em um único gate/CLI privado; qualquer falha bloqueia revisão de release.

## Evidência de CI das entregas recentes

Todas as quatro entregas F134–F137 concluíram seus workflows em Node 22/24 com **SUCCESS**, inclusive a validação geral offline:
- F134 HEAD `db56db6a1068e62165f314855be1a29e9d07f4f6`
- F135 HEAD `e6ebe95776e8cee6df4da636287015e47a435194`
- F136 HEAD `947eb1e12096f75a18fbb492b780a64f013b396e`
- F137 HEAD `ff90e8c922dde8b60a5568f0f81b73a5175bd4dd`

Na RC50, **reexecutar todos os workflows na HEAD imutável da própria PR**. A conclusão dessas execuções deve ser verificada antes de qualquer aprovação, assim como o inventário paginado e a revisão de alterações sensíveis.

## Integridade e não exposição de dados

Não gravar URL privada do GSC, consultas, CPF/CNPJ, nomes, leads, tokens, certificados, chaves, arquivos de recepção HTTP, IPs de staging ou segredos em PRs públicos. Os testes existentes usam apenas `example.test` e material sintético.

Uma propriedade Search Console conectada no OpenSEO **não concede automaticamente** à aplicação Portal OAuth Google, grant por empresa, consentimento ou serviço de acesso. Não declarar integração Google de produção só por existir acesso externo em outra ferramenta.

## Bloqueios para homologação real

1. Revisão completa das alterações acumuladas das RCs, workflows, dependências, migrations, PRs paralelas e integridade das branches.
2. Staging Leaseweb **isolado** e operacional, sem conflito com Portal, CRM, Sites, Performance e demais serviços; backup/restauração e rollback real comprovados.
3. Captura **autorizada** de respostas HTTP de URLs legadas no staging, com identidade do servidor e certificado TLS confirmados. Head/GET 301 e final 200, sem loops ou 302/307.
4. Build novo realmente servido pelo staging, com HTML, canonical, hreflang, robots e sitemap correspondentes e conteúdo territorial legítimo.
5. Inventário de URLs antigas revisado e equivalência editorial 1:1, sem redirecionar serviço errado para homepage indiscriminadamente.
6. OAuth/grants GSC e GA4 reais, aprovação LGPD e isolamento tenant verificados independentemente.
7. IBGE oficial, páginas úteis/editoriais, análise de links/backlinks e estratégia de hospedagem/host sem www ratificadas.
8. Aceite humano final para qualquer merge, deploy, DNS, Cloudflare, Nginx ou publicação.

**Estado: HOLD.** Nenhuma alteração de produção, DNS, VPS, cobrança ou clientes é autorizada por esta revisão.
