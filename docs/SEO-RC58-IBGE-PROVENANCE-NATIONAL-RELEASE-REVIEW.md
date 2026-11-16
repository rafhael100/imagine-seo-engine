# Imagine SEO RC58 — integridade IBGE e cobertura nacional com diferenciação territorial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC57 #224](https://github.com/rafhael100/imagine-seo-engine/pull/224), [F153 #225](https://github.com/rafhael100/imagine-seo-engine/pull/225) e [F154 #226](https://github.com/rafhael100/imagine-seo-engine/pull/226).

## Resultado consolidado de engenharia

A RC57 mantém a linha de homologação com Docker real (recursos aplicados, porta loopback, limites de rede, Nginx com 301 e HTML real, SHA do build, rollback sintético). A RC58 adiciona um bloqueio editorial/técnico **antes da expansão de páginas por cidade**:

1. **F153:** confere referência territorial IBGE **edição 2025** após F111/F110: 5.569 candidatos municipais mais DF/Brasília e distrito estadual de Fernando de Noronha, totalizando 5.571 localidades estatísticas. Verifica 27 UFs, códigos únicos, ordem, prefixos e rótulos dos dois casos especiais; recusa fonte incompleta. Não classifica automaticamente os outros geocódigos como municípios juridicamente certificados.
2. **F154:** combina SHA-256 do recibo de captura HTTPS F117 **nos mesmos bytes** da referência com a checagem estrutural F153. Recibo alterado ou dataset incompleto são bloqueados mesmo quando o outro controle, isoladamente, seria coerente.
3. As duas etapas são **offline, privadas, sem Google nem VPS**, não geram páginas, não iniciam indexação e mantêm `sourceAuthenticatedByIndependentChannel=false`, `publicationAuthorized=false`.

## Evidências de origem

| Entrega | CI verificada |
|---|---|
| RC57, PR #224, HEAD `72feebb7e89dc4a38b0e53dbc56d878a0d088e56` | **35/35 workflows SUCCESS** |
| F153, PR #225, HEAD `995d957cf1ce4d9256bc019c649a0e723d0225b2` | **2/2 SUCCESS**, Node 22/24 |
| F154, PR #226, HEAD `2ca0ceb3ad2c408752d3abf84cd86d5a93101bd3` | **2/2 SUCCESS**, Node 22/24 |

**A RC58 necessita CI integral na própria HEAD**, inventário paginado e revisão independente do diff. Nenhuma evidência de CI local substitui o teste de captura real da API oficial.

## Fontes e edição

- [Malha Municipal Digital 2025 IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html): 5.569 municípios, DF, distrito estadual e duas áreas operacionais; 5.573 geocódigos espaciais **não são** 5.573 municípios.
- [Registro de Referência de Municípios](https://www.gov.br/conecta/catalogo/apis/registro-referencia-municipios): API governamental da lista de localidades.
- [Estatísticas populacionais 2026 IBGE](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html): atualização de estimativas por unidade estatística, distinta da edição jurídica de malha.

A captura F117 pela API `https://servicodados.ibge.gov.br/api/v1/localidades/municipios` continua **pendente de sucesso operacional autenticado**: ocorreu timeout no GitHub Actions de 15/11/2026 e uma consulta externa atual também não conseguiu acessar esse endpoint. Uma execução `npm test` bem-sucedida não torna a captura real aprovada.

## Próximos passos ordenados para evitar recomeçar entregas

1. Conferir CI RC58 e inventário integral; revisão AppSec de alterações de scripts, Docker e fonte IBGE.
2. Repetir a captura oficial F117 **uma vez**, quando houver conectividade autorizada: salvar origem JSON + recibo privado SHA e verificar offline F117/F154. Não aceitar mirror sem origem autenticada; distinguir falha temporária de rede de falha do contrato.
3. Conferir edição IBGE oficialmente vigente, não presumir que a edição 2025 permanece atual quando for publicada a malha 2026.
4. Construir um **lote editorial pequeno e útil**, com intenção de busca e cobertura real do serviço Imagine, evitar doorway, nomes de cidades e clones de texto; PT/EN/ES e canonical/hreflang completos antes de expandir.
5. Relacionar às páginas comerciais com o funil Imagine (visitas → leads → clientes) sem taxas de conversão enganosas.
6. Obter GSC real por propriedade e empresa, consentimento e retenção LGPD; validar UX/admin/tenant do Portal e revisão independente.
7. Executar F147–F152 **somente em staging Leaseweb autorizado**, depois de identidade de host, inventário atual, recursos, CVEs Nginx, firewall/egress, backups/restauração e rollback real.
8. Liberação de DNS/Cloudflare/indexação/merge **somente com aceite humano específico** e sem custos extras não aprovados.

**Status de entrega: engenharia de laboratório validada na origem; release de produção permanece HOLD.** Não houve merge, publicação, mudança DNS, instalação na VPS, alteração de CRM/Sites/Portal ou dados de clientes.
