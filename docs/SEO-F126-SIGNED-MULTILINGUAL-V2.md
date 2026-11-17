# SEO F126 — relatório Ed25519 v2 para auditoria multilíngue real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua a F125 #181 do Imagine SEO Engine.

## Por que v2 independente?

O envelope F121 existente utiliza o domínio `IMAGINE-SEO-F122-SIGNED-BUILD-REPORT\n`, formato `seo-f122-signed-build-report-v1` e audita F114/F117. O Portal valida **estritamente** esse v1. Uma atualização silenciosa quebraria a interoperabilidade ou, pior, faria um relatório de auditoria parcial passar por auditoria integral.

F126 implementa um **emissor separado**, com domínio Ed25519 `IMAGINE-SEO-F126-SIGNED-MULTILINGUAL-REVIEW\n` e envelope `seo-f126-signed-multilingual-review-v2`.

## Emissor

`signMultilingualBuildEvidence(auditInput, trustedCIContext, privateKey, issuedAt)` realiza antes da assinatura a auditoria local F122/F123/F124 sobre HTML efetivamente compilado. Emite um DTO privado de diagnóstico com contagens permitidas, sem cidades, geocódigos, paths, texto ou digests da página.

- `tenantRef`, `runRef` e SHA completo do commit são parâmetros de **runner CI confiável**; nunca vir de formulário, payload HTTP ou objeto do operador.
- Apenas laboratório: `CI=true`, `APP_ENV=testing`, `SEO_F126_SIGNER_LAB=1`.
- Chave privada Ed25519 é fornecida pelo chamador em memória; o emissor não a cria, armazena, registra nem publica.
- Payload assinado contém issuer/audience restritos ao laboratório, tenant/run/commit, timestamps, validade máxima de 240 s, nonce aleatório, hash SHA-256 e conteúdo UTF-8 exato do relatório em base64.
- Um build bloqueado **continua bloqueado após ser assinado**. Assinar um diagnóstico não concede direito de publicar.
- O resultado nega explicitamente identidade real, custódia de chave de produção, ledger antirreplay, publicação e visualização por clientes.
- O DTO é limitado a 16 KiB, o payload a 25 KiB; não há envio de rede.

## Testes

Node 22/24 assina relatório derivado de **HTML PT/EN/ES real em diretórios temporários**, comprova 9 relações hreflang e canonical/sitemap/robots; testa caso sem links que deve continuar bloqueado, assinatura verificável, nonce diferente, adulteração, chave pública errada, domínio v1 incompatível e rejeição fora de CI.

## Integração Portal

O Portal deverá receber uma classe **separada** para v2, com prefixo e contrato estritos, conferir digest e limites, rejeitar campos desconhecidos e recusar todo acesso ao cliente. Só depois haverá prova cruzada Engine → Portal com **commit imutável**. O verificador F122 v1 não deve ser alterado.

Para produção: autenticação de organização, chave em KMS/HSM ou proteção equivalente, RLS/revogação, retenção LGPD, staging com backup/reversão, validação oficial IBGE e revisão editorial são gates obrigatórios.
