# SEO F114 — confrontar inventário municipal com build estático efetivo

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F113 #161](https://github.com/rafhael100/imagine-seo-engine/pull/161).

## Mudança

As etapas F107–F112 avaliam conteúdo, município, inventário e geram prévias **privadas**. A F114 usa o auditor existente F0 do SEO Engine para ler uma cópia **local do build compilado do site** e confrontá-la com os caminhos canônicos declarados no inventário F108. Isso é diferente de dizer que páginas planejadas existem em produção.

O auditor confere HTML real, marcações canonical e Open Graph, robots, sitemap, hreflang multilíngue, links internos e vazamentos de prévias internas F113. A F114 acrescenta:

- Quantos caminhos municipais declarados estão presentes e quantos não foram encontrados no build.
- Índices de até 200 linhas do inventário que precisam ser corrigidas, sem publicar suas URLs.
- Quantidade de páginas do build fora do inventário municipal, **sem presumir que sejam erros**, pois o site tem páginas institucionais legítimas.
- Categorias e contagens dos problemas técnicos (não inclui nomes de arquivos, URLs, tokens, HTML ou conteúdos de clientes).
- Bloqueio da revisão se houver conflito no inventário, página ausente ou erro técnico do auditor.

## Executar no desenvolvimento, sem publicar

```bash
node scripts/review-geo-static-build-offline.mjs   private-inventory.json /caminho/local/para/dist   https://imaginecomunicacao.com.br/
```

Exige inventário com 1–20.000 registros (limite do auditor real de páginas) e arquivo de até 10 MiB, usando a validação F108. A auditoria opera exclusivamente sobre diretório local e usa HTTPS apenas como **origem textual esperada**; não faz requisições de rede.

O comando produz JSON sanitizado: sai com **código 1** para resultado bloqueado, **2** para entrada inválida/erro de leitura, e **0** para revisão técnica sem bloqueios encontrados. **Código 0 não é autorização de publicação.**

## Gates que ainda exigem homologação

- A origem IBGE e a completude do inventário continuam não verificadas.
- O código não confere o SHA-256 editorial com o HTML publicado, porque o manifesto F108 contém o digest do **corpo de texto**, não do documento final.
- Um build local não comprova que o host em produção esteja igual. A origem HTTPS é uma declaração do operador, não um teste TLS.
- Hreflang é revisado pelo auditor estático existente; traduções precisam de clusters consistentes e recíprocos.
- O pipeline público requer aprovação editorial, autenticação Portal, consentimento/LGPD, segurança, backups, staging, rollbacks e aceite de release.

Teste: `npm test` (Node 22/24 em CI), incluindo páginas geradas em diretórios temporários, regressão de detectores de vazamento privado e privacidade dos relatórios.

**Sem rede, deploy, merge, GitHub main, VPS, publicação de sitemap ou dados de clientes.**
