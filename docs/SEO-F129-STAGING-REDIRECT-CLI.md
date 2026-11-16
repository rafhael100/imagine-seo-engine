# SEO F129 — auditoria operacional offline de redirecionamentos em build real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F128 #185](https://github.com/rafhael100/imagine-seo-engine/pull/185).

A F129 transforma o gate F127 + F128 em um comando utilizável pelo operador de homologação, sem qualquer alteração de DNS ou servidor:

```bash
node scripts/review-legacy-migration-build-offline.mjs /CAMINHO/PRIVADO/manifesto.json /CAMINHO/BUILD/DIST > relatorio-sem-urls.json
```

O manifesto segue exatamente o contrato F127. O CLI exige arquivo local regular, recusa symlink, limita o tamanho a 20 MiB, exige diretório de build real, decodifica UTF-8 estrito e roda a auditoria técnica de HTML, canonical, robots, sitemap, idioma e prévias privadas.

## Saídas

- **0**: destino compilado e mapeamento estruturalmente coerentes; continuar em revisão humana (não aprova implantação).
- **2**: rota não construída, divergência de idioma, sitemap incompleto, problema técnico de HTML ou URL antiga sem mapeamento.
- **1**: parâmetros/arquivos/JSON inválidos ou inseguros.

A saída é somente JSON de contagens e índices de inventário. Nunca mostra domínio, caminho da origem, conteúdo, query do GSC, credenciais ou URL. Erros são genéricos e não devolvem detalhes dos arquivos privados.

## Proteções de release

Uma análise offline verde **não cria nem prova** redirecionamentos HTTP 301 em produção. Os novos hosts e a equivalência de páginas antigas precisam ser comprovados por inspeção SEO e editorial independente. Aplicação na Cloudflare/Nginx/DNS, monitoramento GSC, backup e rollback requerem homologação autorizada separadamente.

O comando deve ser executado sobre snapshot/checkout imutável para evitar troca do build durante as leituras de filesystem. O relatório pode acompanhar a aprovação técnica sem transportar dados de GSC para repositório público.

Os testes F129 incluem operação sobre HTML realmente gravado localmente, página ausente do sitemap, symlink proibido e JSON malformado. Executam em Node 22 e 24.
