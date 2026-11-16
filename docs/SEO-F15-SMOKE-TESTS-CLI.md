# SEO-F15 — Pré-liberação offline com smoke tests

Os novos testes de integração, executados pelo mesmo `npm test` do CI, exercitam CLIs em processos Node independentes e diretórios temporários:

1. Auditoria de build estático sintético completo com URLs, sitemap e robots.
2. Importação e comparação de exportações CSV sintéticas (incluindo consulta com e-mail) sem vazar o termo bruto na saída.
3. Comparador de auditorias reprovando substituição silenciosa de uma URL pública.

**Critério de aceite offline:** suíte completa verde em GitHub Actions, sem rede, sem dados de clientes, sem credenciais e sem atualização de `main`.

**Não é o aceite de produção.** Ativação real depende de acesso à propriedade GSC, integração autenticação Portal/tenant, VPS, LGPD, testes E2E reais e revisão humana de publicação.
