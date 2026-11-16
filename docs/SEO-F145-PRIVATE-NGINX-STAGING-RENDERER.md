# SEO F145 — gerar configuração Nginx de staging com o manifesto real aprovado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da RC53 [#212](https://github.com/rafhael100/imagine-seo-engine/pull/212). Prepara o passo operacional seguinte: **gerar as regras de staging diretamente do inventário privado de URLs históricas**, em vez de transcrevê-las manualmente para um Nginx de demonstração.

## Como funciona

`renderIsolatedNginxStagingConfig({migrationInput,buildDirectory})`:

1. Valida o manifesto **exato** F127 com origem canônica HTTPS sem www, destinos 301, localização linguística e ausência de loops/URLs não aprovadas.
2. Exige até 80 URLs e 80 rotas compiladas por lote de homologação. Restringe paths a slugs seguros com ASCII minúsculo para evitar injection/case confusion no `map` do Nginx.
3. Roda F128 contra o HTML compilado **real**, validando destinos, sitemap, canonical e privacidade.
4. Calcula o SHA-256 F140 do build. **Só então** renderiza em memória uma configuração Nginx com `map` de origem `X-Forwarded-Proto|Host|request_uri` → URL canônica aprovada, usando **apenas entradas explícitas do manifesto**.
5. Permite leitura do host canônico com esquema HTTPS e healthcheck local, rejeitando por padrão origens e hosts não declarados. Não há redirect genérico com página não equivalente.
6. O header `X-Imagine-SEO-Build-SHA256` é preenchido com o digest local, para que F141/F143 confrontem com o build auditado. Esse cabeçalho **não é assinatura de origem**, KMS, TLS nem permissão de publicar.

## Comando em workspace privado

```bash
node scripts/render-private-nginx-staging-config.mjs \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --out /AREA-PRIVADA/nginx-redirects-staging.conf
```

A entrada deve ser um manifesto F127 previamente revisado; o operador escolhe o diretório HTML de destino. A CLI recusa arquivo de entrada symlink, JSON inseguro, URL fora do escopo, deploy inventado e diretório de saída dentro do Git. Ela **nunca sobrescreve** o arquivo: cria a configuração com `O_EXCL` e modo `0644`, para permitir montagem read-only no contêiner Nginx sem privilégios. Proteger o **diretório pai** contra leitura pública (permissões de diretório/ACL), pois o arquivo inclui URLs históricas. O stdout contém somente códigos e contagens; não inclui domínio, URLs, SHA nem configuração.

## Teste completo em CI

A F145 atualiza o laboratório Docker Compose F144: o Nginx do cenário bom usa agora a **configuração gerada pelo código**, não uma regra escrita à mão. O cenário propositalmente errado mantém o mesmo SHA mas serve HTML de outra rota. CI Node 22/24 executa a suíte geral, configuração Nginx real e F143 de ponta a ponta.

## Restrições essenciais

- A configuração se aplica **somente** a um proxy Nginx isolado com `Host`/`X-Forwarded-Proto` simulados; **não usar como Nginx público** sem tratar TLS/SNI, Cloudflare, proxy-trust, validação de host e segurança de rede.
- O Compose F144 usa bridge exclusiva do projeto (não `internal:true`, devido à necessidade de publicar loopback) e pode oferecer egress. Não instalar diretamente no host multiempresa sem firewall/política de isolamento.
- Imagem de CI fixada por digest para reprodutibilidade; exige atualização/CVEs antes de implantação real.
- Faltam GSC OAuth/tenant, IBGE e conteúdo editorial, validação HTTPS pública e prova de isolamento/backup/rollback na Leaseweb.

**A F145 gera arquivo de configuração local. Não modifica o Nginx ativo, abre porta, cria contêiner, altera DNS ou publica páginas.**
