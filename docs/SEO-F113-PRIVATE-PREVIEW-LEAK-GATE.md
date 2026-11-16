# SEO F113 — impedir vazamento de prévias editoriais para o build público

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação do [RC41 #160](https://github.com/rafhael100/imagine-seo-engine/pull/160).

## Problema
A F112 gera arquivos HTML privados, para revisão humana, com `noindex`. Uma cópia acidental desses arquivos para um build público não é mitigada adequadamente por `noindex`: o conteúdo ainda seria entregue ao público. Tampouco podemos depender de alguém deixar a meta tag original intacta.

## Implementação
- Todas as prévias F112 incluem a marca de finalidade `<meta name="imagine:editorial-preview" content="private-unpublished-review">` e continuam com `noindex,nofollow,noarchive`.
- O auditor estático F0 detecta essa marca na seção HEAD efetiva, antes de aceitar um arquivo como página do build. Também reconhece o aviso literal de prévias antigas na área visível do documento.
- Erro `private_editorial_preview_in_public_build`: **bloqueia o gate de qualidade** mesmo quando a meta `robots` foi adulterada para `index,follow`.
- O auditor ignora comentários HTML e blocos `template` inertes para evitar falsos positivos.
- Nada é publicado ou acessado externamente; as evidências são colhidas do build local do site.

## Regressões
A suíte executa testes para o arquivo original F112, remoção simulada de `noindex`, arquivo legado sem marcador, texto inerte e páginas públicas normais. O comando existente `npm run audit:dist -- <dist> --site-url=<origin>` continua sujeito às opções reais do CLI; conferir `scripts/audit-dist.mjs` e `src/audit-cli-args.mjs` antes de executar em builds reais.

## Limites
Essa proteção reconhece um marcador e uma mensagem editorial conhecida. Ela **não** substitui revisão de diretórios publicáveis, isolamento de staging, checagem de acesso, logs, bloqueios do CDN, inspeção de artefatos nem testes em ambiente real; arquivos modificados para remover todos os sinais ainda podem escapar. Não há merge, deploy, OAuth Google real ou dados de clientes.
