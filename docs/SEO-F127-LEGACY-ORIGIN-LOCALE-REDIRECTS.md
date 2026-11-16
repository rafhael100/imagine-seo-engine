# SEO F127 — preflight para migração HTTPS, sem www e `/en-us/`

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [RC46 #183](https://github.com/rafhael100/imagine-seo-engine/pull/183). Sem escrita em DNS, Nginx, Cloudflare, Google, GSC ou publicação.

## Motivo

A auditoria F22 `src/redirect-review.mjs` já confere rotas locais removidas e candidatos `from/to`, mas não distingue a migração **HTTP para HTTPS** nem **www para raiz**, pois só trabalha com caminhos. A versão F127 adiciona um contrato separado de **URLs antigas completas** e destinos canônicos dentro de um build declarado.

Observação de produto: o Search Console do domínio Imagine pode indicar URLs de hosts e idiomas legados. Nenhum relatório privado do Google, consulta individual ou valor de tráfego deve ser versionado neste repositório público. Os testes usam somente o domínio reservado `example.test`.

## Contrato

`reviewLegacyOriginAndLocaleRedirects(input)` recebe exatamente:
- `sourceType: "operator_supplied_legacy_urls_unverified"`;
- `siteDomain`: domínio canônico em minúsculas, sem www;
- `canonicalOrigin`: HTTPS raiz do domínio, por exemplo `https://example.test/`;
- `legacyUrls`: URLs antigas enumeradas, aceitando HTTP/HTTPS e www/raiz exclusivamente desse domínio;
- `targetRoutes`: rotas do novo build declaradas pelo operador, incluindo `/`;
- `candidates`: objetos `{fromUrl,toPath,status:301}`.

As origens, caminhos e candidatos precisam ser explícitos: **nunca** converter automaticamente `/en-us/` em `/en/` ou decidir equivalência de conteúdo com base apenas no idioma. A presença de links `/en-us/` no inventário dispara revisão editorial; uma tentativa de redirecionar inglês para espanhol/português bloqueia a análise.

Rejeita host externo, open redirect, usuário/senha, parâmetros, fragmentos, URL codificada, path traversal, candidatos para rota inexistente, destino igual à origem, duplicatas, métodos não previstos e esquema não HTTP(S). Exige também que URLs ainda canônicas e publicáveis não sejam indevidamente redirecionadas.

## CLI read-only

```bash
node scripts/review-legacy-origin-migration-offline.mjs /CAMINHO/PRIVADO/manifesto-redirecionamento.json > revisao-seo-f127.json
```

O relatório apresenta apenas índices e contagens, sem expor domínio, URLs, nomes de cidades, termos de pesquisa, hashes ou conteúdos. O arquivo local precisa ser regular, não symlink, com até 20 MiB.

Saída `0`: esquema completo para **revisão humana**, jamais autorização de deploy; `2`: entradas sem mapeamento ou com desvio de idioma, bloqueadas; `1`: entrada malformada/insegura. Nenhuma regra de redirecionamento é emitida ou aplicada.

## Antes da migração real

1. Preparar inventário privado de URLs HTTP, HTTPS, www, apex e idiomas antigos, reconciliando Search Console e arquivos do site sem publicar dados sensíveis.
2. Confirmar manualmente equivalência de cada conteúdo, canonical, sinais de indexação, backlinks e possibilidade de redirecionamento 301 direto, sem cadeias ou loops.
3. Testar em ambiente de staging isolado, de preferência com snapshots de configuração, backups e rollback.
4. Validar redirecionamentos reais com HTTP HEAD/GET, sitemap, robots, hreflang e Search Console, somente após autorização operacional.
5. Registrar aprovação humana para DNS, Cloudflare, Nginx e deploy.

**Esta entrega não consulta o Search Console diretamente nem afirma que redirecionamentos já existem.**
