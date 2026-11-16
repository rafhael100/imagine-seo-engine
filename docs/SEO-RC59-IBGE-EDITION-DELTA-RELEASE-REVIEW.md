# Imagine SEO RC59 — origem IBGE, cobertura nacional e segurança de mudanças de edição

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida [RC58 #227](https://github.com/rafhael100/imagine-seo-engine/pull/227), [F153 #225](https://github.com/rafhael100/imagine-seo-engine/pull/225), [F154 #226](https://github.com/rafhael100/imagine-seo-engine/pull/226) e [F155 #228](https://github.com/rafhael100/imagine-seo-engine/pull/228).

## Contribuição operacional

A linha de referência municipal não deve gerar, editar ou remover páginas nacionalmente com base em lista de localidades sem origem e edição confiáveis:

- **F153:** confere offline a edição IBGE MMD 2025, com 5.569 municípios candidatos e duas unidades administrativas especiais (Brasília e Fernando de Noronha), 5.571 registros de localidades estatísticas, 27 UFs, código/ordenação/nome coerentes. É verificação estrutural, **não** prova de origem, nome oficial ou existência dos serviços locais da Imagine.
- **F154:** exige correspondência do recibo SHA-256 F117 com **os mesmos bytes normalizados** usados no controle nacional F153. Recibo forjado, truncamento ou falsa autorização bloqueiam.
- **F155:** compara duas referências privadas F110, identifica mudanças de geocódigos e nomes, registra apenas índices ordinais/códigos genéricos de impedimento e **nunca remove páginas históricas, cria redirect, indexa ou publica** automaticamente. Mudanças futuras exigem nova edição oficial e aprovação editorial.
- A linha anterior **RC57** preserva o teste de contêiner Docker real e a auditoria de isolamento Nginx/CPU/RAM, que não substituem o teste real na Leaseweb.

## Histórico de CI verificado

- RC58, [#227](https://github.com/rafhael100/imagine-seo-engine/pull/227), SHA `e2262e601e61aa9ffdf0eb578c5006da6b9df3b9`: **37/37 workflows SUCCESS**.
- F155, [#228](https://github.com/rafhael100/imagine-seo-engine/pull/228), SHA `06aebdcdd7d295fd21516b05279b48ee2681aae8`: **2/2 SUCCESS**.
- A nova RC59 exige CI integral própria (Node 22/24, Docker real, regressões offline), auditoria paginada de diffs, revisão AppSec/SEO/DBA/LGPD e qualidade editorial independente. PR em DRAFT.

## Sequência restante para finalizar a homologação real

1. Obter **captura oficial IBGE válida e recente**, com cadeia de custódia/verificação independente. O endpoint público apresentou indisponibilidade na CI em 15/11/2026 e não houve nesta linha uma captura real recente bem-sucedida. Executar F117/F154 com recibo correspondente; confirmar edição territorial oficial vigente.
2. Revisar seleção de localidades e geocódigos, incluindo tipologia DF/distrito estadual, mudanças de nomes e atendimento real da Imagine. Validar conteúdo regional útil, original e revisão humana; evitar páginas doorway. F155 serve para alertar mudanças, não operar publicação.
3. Concluir integração editorial SEO com comercial e Portal para lead capture e metodologia **visitas → leads → clientes**, além de SEO técnico: PT/EN/ES, canonical/hreflang/sitemap/robots e redirecionamento histórico equivalente.
4. Homologar Google Search Console por propriedade/tenant com escopo mínimo e consentimento, sem confundir dados da conta de terceiro com autorização do Portal.
5. Na VPS Leaseweb correta e autorizada, coletar inventário de host F148, impedir conflito com CRM/Sites/Portal, revisar imagem Nginx/SBOM/CVEs, limitar egress, fazer backup/restore e rollback. Usar F149–F152 como referência de testes de laboratório, não como comando de deploy automático.
6. Obter revisão independente do histórico acumulado, rodar testes reais autorizados, registrar aceite humano antes de qualquer merge para `main`, DNS/Cloudflare, indexação, criação de contas, despesa ou exposição de clientes.

## Fontes oficiais e limites

- [Malha Municipal Digital IBGE 2025](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html): 5.569 municípios, DF, distrito estadual, duas áreas operacionais. Os 5.573 polígonos da malha espacial **não** são 5.573 municípios.
- [API de localidades governamental](https://www.gov.br/conecta/catalogo/apis/registro-referencia-municipios): referência estatística com 5.571 unidades, sujeita a atualização e validação da origem.
- [Estimativas populacionais IBGE 2026](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html): não é declaração automática de nova edição de malha jurídica.

**NENHUM MERGE OU DEPLOY AUTOMÁTICO.** A evidência de engenharia é laboratorial e não comprova que SEO/site esteja disponível em URL de homologação ou produção. Sem alterações em `main`, VPS, DNS, Google, CRM, Sites ou clientes reais.
