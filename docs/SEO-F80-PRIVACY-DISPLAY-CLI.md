# SEO-F80 — CLI local para apresentação interna segura

Comando de QA (somente leitura de arquivo fornecido voluntariamente pelo operador):

```bash
node scripts/prepare-portal-query-page-display-offline.mjs private-evidence.json
```

O comando lê JSON via `readBoundedLocalText` (até 10 MiB, arquivo regular, sem symlink final, UTF-8 estrito), revalida evidências **originais** por F79/F74/F72/F59 e imprime somente o modelo agregado `seo-portal-query-page-display-offline-v1`. O arquivo fonte não é persistido pelo comando; as mensagens de erro não incluem o conteúdo bruto nem nomes de caminhos privados.

Se o lote tem termos ocultados por privacidade ou pode estar truncado, o JSON imprime `null` nos quatro indicadores por consulta (linhas analisadas, consultas distintas, consultas em múltiplas páginas e páginas associadas), sem sinal editorial e com justificativa. Datas, hashes e SHA do operador **não autenticam** propriedade, consentimento ou integridade Google.

Testes E2E: caso positivo, truncamento, linha pessoal ocultada, symlink, parâmetros extras, JSON inválido, UTF-8 malformado, afirmação falsa de OAuth, arquivo acima do limite e diagnósticos sem ecoar entradas sensíveis.

**NO-GO:** sem OAuth, rede, grants, token vault, persistência de dados, relatórios para cliente, publicação, 301, faturamento, merge em main ou deploy. Os relatórios continuam `customerDisplayAuthorized=false` e `HOLD_EXTERNAL_AUTHORIZATION`. O eventual consumidor PHP deve revalidar o contrato, vincular propriedade e tenant autenticados e aplicar revisão independente AppSec/DBA/LGPD antes de qualquer ativação.
