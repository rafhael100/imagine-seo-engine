# SEO F140 — vínculo entre o build auditado e o proxy de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Após [RC51 #204](https://github.com/rafhael100/imagine-seo-engine/pull/204). A F139 confronta GSC, HTML e 301 no loopback, mas esses elementos poderiam estar apontando para versões diferentes do site. F140 cria um comprovante **de consistência de build**, não de identidade externa.

## Hash determinístico do diretório estático

`fingerprintCompiledSite(buildDirectory)` percorre os arquivos estáticos locais com limite de 20 mil arquivos, 5 mil diretórios, profundidade de 32 e 512 MiB no total. Rejeita links simbólicos, dispositivos, pasta vazia ou sem HTML. A impressão SHA-256 depende do **caminho relativo, tamanho e conteúdo de cada arquivo**, em ordenação estável, não do caminho absoluto da VPS. Não faz rede nem imprime conteúdo, nomes de arquivo ou HTML. A função rejeita arquivos alterados durante a leitura quando o metadata muda.

Para obter o valor que deve ser configurado no **proxy isolado** (não no público):

```bash
node scripts/fingerprint-compiled-site-offline.mjs /AREA-PRIVADA/build
```

O JSON conterá `sha256`, `filesHashed`, `htmlFilesHashed` e `totalBytesHashed`. O SHA **não é uma credencial secreta**, mas só deve ser usado com a configuração de staging da **mesma versão** do build.

## Conferência HTTP local com prova de consistência

O operador configura o proxy de staging para devolver o header:

```
X-Imagine-SEO-Build-SHA256: <sha256 exato do build local>
```

Em seguida, com uma origem canônica e manifesto F127 igualmente aprovados:

```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/verify-staging-build-fingerprint.mjs \
  --manifest /AREA-PRIVADA/legacy-plan.json \
  --build /AREA-PRIVADA/build \
  --port 18290 --enable-loopback-probe
```

Porta ilustrativa, não assumir livre. O comando só envia HEAD `/` para `127.0.0.1` com Host canônico validado, nunca segue redirecionamento nem faz DNS externo. Confere status 200 e igualdade exata do header com o hash recém-calculado. Retorna `0` para **revisão humana**, `2` para divergência ou ausência do header, `1` para erro de entrada/ambiente. A saída da conferência só mostra contagens e flags; não contém o digest em si nem qualquer hostname.

## Segurança e limitações

O header pode ser falsificado por um proxy local mal configurado; a ferramenta **não autentica** o contêiner, certificado TLS, DNS, assinatura de artefato, KMS, repositório ou ambiente público. Confere apenas consistência observada com o loopback. Os testes usam servidor HTTP de loopback real e build local sintético, Node 22/24.

A liberação requer ainda revisão independente SEO/AppSec/LGPD, cadeia de origem do build, edição de conteúdo original por cidade, GSC OAuth/tenant real, TLS/SNI público autorizado, backups e rollback na VPS e aceite humano. Nenhuma implantação, redirect de produção ou migração é efetuada.
