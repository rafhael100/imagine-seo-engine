# SEO F187 — respostas HTTP 301 realmente capturadas em loopback × GSC × Astro compilado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Lacuna identificada

A [F186 #278](https://github.com/rafhael100/imagine-seo-engine/pull/278) integra os contratos F185/F136 para comparar GSC original, candidatos 301, comprovantes HTTP e HTML Astro real. Sua prova de CI com o Comercial F344 utiliza **recibos HTTP sintéticos declarativos**. O sucesso de uma comparação sobre JSON não comprova que um servidor HTTP respondeu com esses status ou cabeçalhos.

## Implementação F187

A nova biblioteca de laboratório `labs/seo-f187-loopback-gsc-cross/verify-local-301.mjs` cria um servidor **somente em 127.0.0.1, porta efêmera**, e usa o capturador F138 já existente para executar duas requisições HEAD reais:
1. Host antigo `www`, protocolo lógico HTTP → resposta 301 e `Location` canônico.
2. Host canônico, protocolo lógico HTTPS → destino HTTP 200.

A captura HTTP privada passa diretamente ao revisor F186, que recompõe propostas de GSC PAGE pela F185 e confere o mesmo caminho com os arquivos HTML Astro realmente compilados pelo F128/F136. Não existe conexão externa Google, DNS, TLS público, configuração Nginx/Cloudflare, token nem deploy.

Há cinco cenários de CI: correspondência válida e quatro falhas, incluindo 302 temporário, `Location` externo, segundo hop de redirecionamento e destino HTTP 404. Cada caso deve produzir a classificação correta. Os testes Node 22/24 executam um build estático sintético independente, e a CI **F186 existente é estendida**, sem novo checkout ou novo `npm ci`, para executar a mesma matriz de provas sobre o **Comercial F344 real, SHA `873815411236ea6f0b333c5826661f177a5ad0c0`**.

O laboratório exige explicitamente `APP_ENV=testing` e `SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK`; a origem HTTP é fixa e o endereço de transporte **sempre** é 127.0.0.1, nunca o host do URL. Não exporta URL, header, dados privados ou recibos no relatório. Saídas mantêm `providerGscAuthenticated=false`, `stagingTlsVerified=false`, `publicationAuthorized=false` e `redirectDeploymentAuthorized=false`.

## Limites e próximos gates

Mesmo uma captura HTTP legítima de loopback é apenas **homologação de laboratório**, não prova de Cloudflare/Nginx ou HTTPS/TLS na Leaseweb. A integração real requer OAuth GSC autorizado por tenant no Portal/Engine, revisão editorial de equivalência de cada rota, verificação privada na VPS isolada, backup/restauração, rollback e GO humano específico. Nenhuma regra pública é aplicada.

A F187 aproveita F138, F185 e F186 sem reescrever nem enfraquecer esses contratos.
