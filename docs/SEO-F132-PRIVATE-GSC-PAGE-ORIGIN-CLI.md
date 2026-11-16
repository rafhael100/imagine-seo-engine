# SEO F132 — comando privado para GSC page-origin audit (offline)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [F131 #191](https://github.com/rafhael100/imagine-seo-engine/pull/191).

## Como usar

Exportar um JSON local **somente com dados por página** no contrato F131, revisado pelo operador, sem tokens Google, nomes, e-mails, consultas de busca nem dados de clientes. Armazenar o arquivo somente em volume privado, nunca no repositório público.

```bash
node scripts/review-gsc-page-origins-offline.mjs /CAMINHO/PRIVADO/pages.json > resultado-sanitizado.json
```

O script lê no máximo 20 MiB, recusa link simbólico e arquivo irregular, decodifica UTF-8 estrito, valida o contrato original e escreve apenas o DTO redigido da F131. Erros não revelam nomes de arquivo, credenciais, host, URLs ou JSON original.

## Códigos de saída

- `0` — nenhuma divergência encontrada nas **linhas fornecidas**; ainda exige revisão humana.
- `2` — existem sinais de origem legada, URLs privadas redigidas ou paginação incompleta; **revisão bloqueante**.
- `1` — entrada inválida ou insegura.

Mesmo com saída `0`, a ferramenta não confirma redirecionamentos HTTP atuais, qualidade SEO, propriedade Google autenticada, paginação integral, resultado de navegação ou autorização de alteração do site.

## Continuidade

Priorizar, após autenticação independente e contrato de escopo seguro: conferência de respostas 301/308 em staging, canonical real, sitemap/robots/hreflang e correspondência com F127–F129. A migração continua sujeita a homologação de VPS, backup/restauração e gate humano. Testes usam exclusivamente domínio reservado `example.test`.
