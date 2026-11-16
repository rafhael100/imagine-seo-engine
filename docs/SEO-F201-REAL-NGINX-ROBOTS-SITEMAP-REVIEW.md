# SEO F201 — robots.txt e sitemap.xml realmente servidos pelo Nginx F348

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Lacuna fechada

A [F197 #296](https://github.com/rafhael100/imagine-seo-engine/pull/296) confirmou **Nginx Docker real**, 2 respostas 301 HEAD e 3 páginas HTML realmente servidas e idênticas ao Astro F348. Os arquivos `robots.txt` e `sitemap.xml` já eram **auditados localmente**, mas não havia comparação entre os bytes desses arquivos gerados e o que o próprio Nginx efetivamente respondia por HTTP. Uma configuração incorreta, redirecionamento, resposta HTML em lugar de XML ou arquivo desatualizado poderia passar nesse intervalo de integração.

## Novo gate de rede local, sem acesso público

A F201 implementa `reviewNginxLoopbackSeoMetadata` no laboratório `labs/seo-f201-served-metadata/`. O verificador:
- exige `APP_ENV=testing`, `SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK` e uma porta loopback limitada;
- inspeciona ambos os arquivos locais antes de qualquer conexão, recusando symlinks, arquivos enormes, diretórios inválidos e alterações de inode/dispositivo;
- envia **somente a `127.0.0.1`** duas requisições GET reais, com host e protocolo lógico canônico da Imagine; não segue redirects;
- exige HTTP 200, tipo `text/plain` para `robots.txt` e `text/xml` ou `application/xml` para `sitemap.xml`, sem `Content-Encoding` nem `Location`;
- compara os bytes completos das respostas com os arquivos do Astro realmente compilado, sem publicar conteúdo, URL, DNS, headers, caminhos, dados GSC ou informações de cliente;
- mantém `publicRobotsIndexingAuthorized=false`, `deploymentAuthorized=false` e `publicationAuthorized=false` mesmo quando as provas são válidas.

O F197 existente executa **o novo gate F201 sobre o mesmo Nginx Docker real e o mesmo build Comercial F348** antes de marcar o laboratório como validado. Portanto, esta entrega não se limita a testes de um servidor Node simulado.

## Ensaios de regressão

A CI F201 Node 22/24 testa um servidor HTTP local que realmente entrega arquivos, além de falhas adversariais: sitemap desatualizado, redirect inesperado de robots, arquivo local ausente, symlink e ambiente não autorizado. As falhas sensíveis devem ocorrer **antes do primeiro GET** e manter HOLD.

O workflow F197 também é disparado quando a função de metadata muda, para repetir a prova em **Nginx Docker real com F348 SHA `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444`**.

## Limites

Um servidor de laboratório em `127.0.0.1` não comprova que o Googlebot, Cloudflare ou a VPS Leaseweb sirvam os mesmos arquivos em HTTPS público, nem aprova a indexação. Ainda são obrigatórios OAuth GSC por tenant/consentimento, SEO editorial local e serviços comprovados, revisão AppSec/LGPD independente, staging TLS, inventário da VPS, backup/restauração, rollback e GO humano.

Continua a [RC76 #301](https://github.com/rafhael100/imagine-seo-engine/pull/301), preservando `main`, produção, DNS e dados reais de clientes.
