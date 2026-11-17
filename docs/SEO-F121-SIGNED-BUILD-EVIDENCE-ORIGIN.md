# SEO Engine F121 — assinatura de auditoria na origem (somente laboratório)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua a [RC45 #176](https://github.com/rafhael100/imagine-seo-engine/pull/176) e prepara compatibilidade com a [Portal RC45 #864](https://github.com/rafhael100/imagine-portal/pull/864).

## Mudança
A emissão de relatórios assinados não deve depender de o Portal fabricar um relatório de auditoria e assiná-lo em seguida. A função `signLocalMunicipalBuildEvidence(auditInput,verifiedLabContext,privateKey,issuedAt)` **roda a auditoria real F114/F117 sobre o HTML local** e somente depois cria o envelope Ed25519.

- Obrigatório `CI=true`, `APP_ENV=testing` e `SEO_F121_SIGNER_LAB=1`.
- Chave privada Ed25519 é injetada pelo chamador confiável de CI; nunca gerada, salva, impressa ou enviada pelo módulo.
- Contexto de empresa, execução e SHA do Engine deve ser fornecido por código do runner de testes, não por formulário ou request HTTP.
- Assinatura usa bytes exatos com prefixo `IMAGINE-SEO-F122-SIGNED-BUILD-REPORT\n`, compatível com o verificador PHP F122 do Portal.
- Payload inclui hash SHA-256 do DTO real, nonce aleatório, `issuedAt` e validade de até 240 segundos.
- A auditoria pode resultar em **blocked**; assinar um diagnóstico de falha não transforma o build em aprovado.
- O resultado declara sempre `realSignerCustodyVerified=false`, `realTenantAuthenticated=false`, `replayLedgerLinked=false`, `publicationAuthorized=false` e `customerDisplayAuthorized=false`.

## Testes
`npm test` no Engine em Node 22/24 cobre:
- Geração e assinatura de relatório derivado de arquivos HTML locais de fato, com canonical, sitemap e idioma.
- Validação Ed25519 com a chave pública correspondente, recusa de payload alterado e geração de nonce diferente.
- Build com marca privada indevida continua bloqueado, mesmo assinado.
- Chamadas fora de CI, com chave pública no lugar da privada, ou contexto alterado são rejeitadas.

## Próximo passo
Integrar o emissor Engine na CI cruzada do Portal, substituindo o signer sintético mantido no próprio Portal, para comprovar interoperabilidade. Isso ainda não é deploy nem publicação; o emissor operacional precisa de serviço autenticado, KMS/HSM, identidade tenant+MFA, rotação/revogação, trilha auditável e staging.

A origem IBGE ao vivo, a hospedagem do site e a publicação das páginas permanecem em HOLD.
