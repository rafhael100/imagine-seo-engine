# SEO F150 — testar em Nginx real o Compose gerado pela F149

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Complementa [F149 #219](https://github.com/rafhael100/imagine-seo-engine/pull/219) e as entregas F145/F143.

## Por que este teste era necessário

O `docker compose config --quiet` da F149 valida o schema da configuração, mas **não garante que o contêiner inicialize, consiga ler os arquivos montados ou responda às rotas legadas**. A F150 utiliza **o próprio gerador F149** para criar um Compose sintético e executá-lo em um runner GitHub Actions descartável.

O ensaio de CI:

1. Gera `example.test` PT/EN, sitemap/robots e manifesto de URLs históricas 301 sintéticos.
2. Gera a configuração Nginx F145 a partir do manifesto e build validado; calcula SHA dos arquivos reais.
3. Seleciona uma porta temporária de loopback (não presume porta livre na Leaseweb) e prepara um inventário **fictício** F147/F148 que não menciona clientes reais.
4. Usa F149 para renderizar **o mesmo tipo de Compose que o operador usaria no staging**, com limite 512 MiB/1 CPU, rootfs read-only, config/HTML read-only, nome de projeto e rede isolados, porta `127.0.0.1`.
5. Valida a sintaxe com `docker compose config`, e **somente no runner descartável** executa `docker compose up -d --wait --pull always --no-build`.
6. Executa o gate real F143 contra esse Nginx: exige dois 301 legados, dois GETs HTML byte a byte idênticos e header SHA correspondente, sem marcar produção autorizada.
7. Desliga **apenas o projeto efêmero criado pelo teste** e remove o diretório privado de fixture. Não cria artefatos externos contendo URLs ou nomes de serviços.

## Fronteira de segurança

O Docker neste ensaio é o da **máquina efêmera do GitHub Actions**, não o da VPS Leaseweb. O código exige `GITHUB_ACTIONS=true`, `CI=true`, `APP_ENV=testing` e opt-in explícito para rede loopback. Não foi dado a ele acesso SSH, conta Google, DNS, credencial de produção ou cliente real.

Esse teste mostra que o Compose **gerado** inicia e atende ao fluxo funcional sintético. Ele **não** comprova identidade da VPS, estado atual dos demais contêineres, backup/restauração real, TLS/SNI público, segurança de rede e CVEs da imagem Nginx. A própria coleta de inventário no host F148 ainda precisa ser executada por operador autorizado.

Antes de qualquer teste real na Leaseweb, exigir aprovação do inventário atual, reserva de recursos, firewall e egress, CVE/SBOM de Nginx, imagem fixada e revisada, backup/restauração e rollback, isolamento de CRM/Sites/Portal, GSC por tenant e conteúdo editorial original conforme as regras Imagine.

**Status: laboratório validável por CI; NO-GO para merge, produção e deploy real.**
