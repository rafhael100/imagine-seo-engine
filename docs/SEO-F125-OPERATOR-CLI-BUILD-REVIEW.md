# SEO F125 — comando offline para auditar build Astro e páginas municipais multilíngues

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F124 #180](https://github.com/rafhael100/imagine-seo-engine/pull/180), somente verificação de arquivos locais; não altera VPS, não chama Google/IBGE e não publica.

## Como executar em uma cópia local do build de homologação

```bash
node scripts/review-municipal-build-offline.mjs /CAMINHO/PRIVADO/inventario.json /CAMINHO/DO/BUILD https://imaginecomunicacao.com.br/ > relatorio-seo.json
```

A entrada é o inventário F108 do operador, contendo `sourceType: "operator_local_inventory_unverified"` e `entries` com serviço, geocódigo, UF, locale, caminho canônico e hash de conteúdo declarado. O diretório deve conter HTML estático real, `robots.txt` e `sitemap.xml`.

## O que acontece

1. Verifica arquivo de inventário regular (sem symlink) de no máximo 24 MiB e diretório de build local regular.
2. Exige origem HTTPS sem credenciais, porta, query ou fragmento.
3. Executa F122 + F123 + F124: paridade de três idiomas, conferência das rotas e idiomas realmente compilados, canonical/robots/sitemap, bloqueio de prévias privadas e verificação das nove relações hreflang por grupo trilíngue.
4. Emite **apenas JSON redigido** com contagens e índices de linhas; nenhum domínio, cidade, geocódigo, URL, texto ou digest do inventário é impresso. Erros de leitura/validação não reproduzem parâmetros privados.

## Códigos de saída

- `0`: nenhum bloqueio nos controles locais; **revisão humana ainda obrigatória**.
- `2`: auditoria bloqueada; corrigir inventário/build antes da revisão.
- `1`: argumento, arquivo ou formato inválido.

Ao automatizar em CI, trate apenas `0` como candidato a **revisão**, nunca como liberação. O relatório ainda indica `publicationAuthorized:false`, `indexingAuthorized:false` e `customerDisplayAuthorized:false`.

## Segurança e limites

A revisão é exclusivamente offline e não comprova que o site público serve o mesmo build. Não autentica fonte IBGE, tradução, oferta local, GSC, CRM ou autorização empresarial. A auditoria revisita arquivos localmente para as verificações independentes F114/F124; execute em checkout e build **imutáveis**. Sem isolamento da árvore e revisão de produção, não é aprovação de publicação.

A integração do novo relatório completo com o envelope Ed25519 existente exige protocolo versionado e atualização conjunta do verificador do Portal — **F125 não altera nem substitui a assinatura F121**.

Testes de CLI cobrem: build trilíngue válido para revisão; falta de `hreflang`; link simbólico no inventário; URL HTTP e JSON malformado, garantindo códigos de saída e redação de dados privados em Node 22/24.
