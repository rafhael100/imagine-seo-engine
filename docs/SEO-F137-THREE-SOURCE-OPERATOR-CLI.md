# SEO F137 — comando único de revisão offline GSC + 301 + HTML

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [F136 #197](https://github.com/rafhael100/imagine-seo-engine/pull/197).

## Uso em diretório de trabalho privado e somente leitura

Criar um arquivo JSON privado com exatamente quatro campos: `gscPageInput` (F131), `migrationInput` (F127), `httpCapture` (F134) e `buildDirectory` (caminho local do site estático compilado, auditado pelo F128). Nunca comitar esse JSON, nem tokens Google, nomes de clientes, dados pessoais, host da VPS ou credenciais.

```bash
node scripts/review-migration-cross-evidence-offline.mjs /CAMINHO/PRIVADO/cross-evidence.json > status-sanitizado.json
```

- `0`: três verificadores coerentes; **somente revisão humana**, nenhum deploy autorizado.
- `2`: pelo menos uma das três provas está bloqueada; corrigir antes de qualquer promoção.
- `1`: formato inválido, diretório de build inseguro, JSON corrompido ou falha de auditoria; bloquear.
- Entrada até 32 MiB, arquivo regular sem symlink, UTF-8 estrito. Diretório de build deve ser real, não symlink; F0/F128 executam leitura limitada e protegem contra links perigosos.
- A saída só contém contagens/códigos/flags de estado; não imprime URLs, headers, páginas, hosts, tenant, cookies ou texto editorial.
- **Sem rede nem escrita no site ou Git main.** Resultado é evidencia auxiliar; nenhum OAuth, captura HTTP autenticada ou publicação ocorre.

## Requisitos externos

Portal: grant GSC por empresa/serviço, consentimento, autorização de propriedade, identity/MFA, leitura apenas e retenção LGPD.

SEO: origem canonical/hreflang, conteúdos de qualidade, IBGE oficial e validação independente.

VPS: staging isolado, prova de TLS/HTTP real, backup, restauração, monitoramento de ports/volumes Docker, rollback e aprovação da promoção. Os testes são sintéticos; o resultado da CLI não é uma URL publicada.
