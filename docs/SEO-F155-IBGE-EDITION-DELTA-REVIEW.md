# SEO F155 — identificar mudanças entre edições de localidades IBGE

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC58 #227](https://github.com/rafhael100/imagine-seo-engine/pull/227) e complementa a referência nacional F153/F154.

## Por que é necessário

A Imagine pretende administrar páginas nacionais com município, UF, variações de idioma e conteúdos editoriais aprovados. Uma mudança futura do catálogo do IBGE pode adicionar uma localidade, remover um código, renomear município ou alterar uma categoria territorial. **Nada disso autoriza apagar páginas ou aplicar redirects automaticamente.**

A F155 compara duas versões privadas da referência F110/F111, **sem acesso à internet**, validando que cada arquivo contém entre 5.500 e 6.000 códigos de sete dígitos, em ordem, sem duplicatas, com prefixo UF e nomes seguros. Requer a estrutura exata de referência já usada no Engine.

Resultados possíveis: fonte idêntica → somente `human_current_edition_and_source_review_required`; mudança em códigos, nomes ou classificação especial → `blocked` para revisão, sem alterar site, banco, `sitemap.xml` ou páginas.

## Mudanças reconhecidas

- Códigos novos, que dependem de confirmação jurídica e edição da malha;
- Códigos ausentes no novo arquivo, que **não** devem provocar remoção automática;
- Alterações de nomes, que exigem auditoria de slugs, links internos, canonical, hreflang e eventuais 301 com equivalência de conteúdo;
- Inconsistências UF/geocódigo, recusadas como input inseguro;
- Alterações em Brasília/DF e Fernando de Noronha/PE, tratadas como categoria especial que não pode virar página municipal por acidente.

Os relatórios exibem **somente contagens, códigos de bloqueio e até 50 índices ordinais**. Não mostram nomes, geocódigos, conteúdo editorial, links, credenciais ou snapshots. Flags `historicalPagesDeletedAutomatically`, `redirectsCreatedAutomatically`, `publicationAuthorized` e `indexingAuthorized` permanecem sempre **false**.

## Uso offline

```bash
node scripts/review-ibge-reference-delta-offline.mjs \
  /AREA-PRIVADA/ibge-ref-anterior.json \
  /AREA-PRIVADA/ibge-ref-nova.json
```

Ambas as referências devem ter origem, data, versão e cadeia de custódia separadamente verificadas, idealmente vinculadas ao recibo F117/F154. Código 0 = revisão humana; 2 = diferenças territoriais detectadas e bloqueadas; 1 = entrada inválida. Não expor listas completas em PR público.

## Atenções de produção

Mesmo arquivos idênticos podem ser duas cópias de uma origem falsificada; essa rotina **não autentica o IBGE** nem atesta que a edição de Malha 2025 seja a mais recente. Não confundir 5.569 municípios e as duas unidades estatísticas especiais. Os critérios precisam de atualização explícita quando houver nova edição legal oficialmente verificada.

Continuam pendentes: captação oficial real F117, IBGE e conteúdo original por cidade, propriedade GSC, Portal/Sites, revisão editorial e LGPD, staging Leaseweb isolado, segurança independente, backups/rollback e autorização humana de publicação.

**Sem merge, deploy, DNS, publicação, cobrança ou alteração de dados reais.**
