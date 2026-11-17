# SEO F135 — execução segura da auditoria de respostas HTTP 301 em staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Complementa F134 [#195](https://github.com/rafhael100/imagine-seo-engine/pull/195).

## Uso

Com o **registro privado** de capturas de HEAD/GET já coletadas por operador confiável e no contrato de F134:

```bash
node scripts/review-staging-http301-receipts-offline.mjs /CAMINHO/PRIVADO/receipts.json > revisao-sanitizada.json
```

O JSON de entrada deve conter `migrationInput` (manifesto F127) e `capture` (recibos F134). Nunca colocar cookies, tokens, corpos HTTP, IDs de clientes ou cabeçalhos de autenticação no arquivo.

- Arquivo regular de no máximo 24 MiB, sem link simbólico; UTF-8 fatal; JSON e campos de autoridade estritos.
- Saída contém apenas contagens, índices e códigos fixos de diagnóstico; exceções não imprimem caminhos nem URLs.
- Código **0**: todos os recibos fornecidos são coerentes com o plano; revisão humana ainda obrigatória.
- Código **2**: mapeamento/captura incompleto ou contraditório; bloquear aprovação.
- Código **1**: entrada irregular/inválida; bloquear.
- Zero rede, zero deploy, zero credenciais e zero alterações em `main`.

## Antes de usar com uma implantação real

Validar o ambiente/staging com autenticação, escopo de IP/TLS e controles anti-SSRF do operador; confirmar que a captura não veio do site público errado. Comparar resultado com HTML realmente compilado, conteúdo editorial equivalente, sitemap e canonical. Ensaiar rollback e backup, inspecionar o estado do Portal/Sites/CRM na VPS, fazer revisão independente e obter aprovação humana.

A ferramenta **não executa HTTP nem prova autoria da captura**. Testes de Node 22/24 usam somente `example.test` sintético.
