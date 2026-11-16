# SEO F195 — Comercial F346→F348: identidade Git, navegador e HTTP HEAD real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Integração do trabalho paralelo

A [PR #291](https://github.com/rafhael100/imagine-seo-engine/pull/291) implementou a revisão dos dois builds Astro F346 `9c4b29c168ef0d53abfbf44e64c404fbcc8dc01a` e F348 `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444`, verificando que o site passou a informar honestamente, em PT/EN/ES, que a contratação pública ainda não está disponível. A CI da PR #291 passou em 2/2 workflows.

A F195 **preserva exatamente** o verificador de conteúdo e o workflow de builds originais, incorporando-os à linha que já contém [RC73 #290](https://github.com/rafhael100/imagine-seo-engine/pull/290) e a proteção privada do Compose. Nenhuma funcionalidade anterior é removida ou substituída.

## Três provas adicionais de integração

1. **Identidade dos builds:** o verificador agora confronta as SHAs informadas com `git rev-parse HEAD` executado em cada diretório de build, exige checkouts Git distintos por inode, proíbe symlinks e não aceita versão apenas declarada em argumento. Testes de repositórios Git temporários demonstram sucesso real, versões trocadas e aliases simbólicos recusados. A presença de Git não fornece assinatura criptográfica de artefato HTML: `outputHtmlCryptographicallyAttested=false`.
2. **Navegação real F348:** além de `npm test`, build Astro e `check:dist`, a CI instala Chromium e executa o `test:browser` nativo do Comercial F348, incluindo fluxo anônimo multilíngue e verificações acessíveis. Isso não autentica pagamento ou Portal e não captura dados reais de clientes.
3. **HTTP real de laboratório:** executa o F187 existente sobre o **mesmo Astro F348 compilado**, com capturas HEAD emitidas por servidor isolado em `127.0.0.1`, exigindo aceitação da resposta 301 e bloqueio de status 302, `Location` externo, segundo hop e destino 404. Reutiliza F186/F138, sem criar um novo capturador ou tocar a rede pública.

São mantidas as auditorias F166 de canonical/hreflang/sitemap/robots e F169 de inventário de páginas F346→F348, além das verificações de aviso de checkout público, todas na mesma CI, sem novo checkout para cada ensaio.

## Dependências de lançamento

O aviso sobre checkout privado é **transparência comercial**, não uma autorização para vender nem uma substituição do fluxo real Portal/Asaas/NF. A prova de HEAD 301 em loopback não comprova TLS/Nginx/Cloudflare na Leaseweb. Ainda faltam grant OAuth GSC por tenant com consentimento, revisão independente AppSec/LGPD, equivalência editorial de URLs históricas, staging autorizado, backup/restauração, rollback e decisão humana específica antes de qualquer merge, publicação ou indexação.

**Esta PR não implanta nenhuma configuração e não altera DNS, páginas públicas ou cobrança.**
