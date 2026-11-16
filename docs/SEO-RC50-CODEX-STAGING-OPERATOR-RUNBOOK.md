# CODEX / OPERADOR — Imagine SEO RC50: execução segura de homologação isolada

Este documento é uma **especificação pronta para execução supervisionada**, não uma autorização para tocar produção. O ambiente atual do GitHub contém múltiplos projetos Imagine; preservar os serviços existentes e perguntar somente por requisitos realmente críticos (credenciais, acesso administrativo e aprovação formal de publicação).

## Escopo e fonte imutável

1. Consulte a PR RC50 do `rafhael100/imagine-seo-engine` e o Portal RC50, além de Imagine Comercial e Sites. Registre SHAs HEAD exatas e os checks. Não assuma que `main` contém as PRs de laboratório.
2. Faça inventário de portas, redes, volumes, contêineres e recursos disponíveis da VPS Leaseweb. **Não reutilize** portas/volumes do CRM ou de outros projetos (historicamente a porta 127.0.0.1:18081 é ocupada pelo CRM).
3. Escolha um workspace de staging exclusivo com nomes/usuários/volumes/portas próprios. Sem alterar DNS de produção, Cloudflare, certificados existentes ou gateways de pagamento. Verifique espaço, logs, timeouts, backup e possibilidade de restaurar antes de iniciar serviços.
4. Use segredos injetados por ambiente seguro, nunca em issue, PR, log, artefato público ou chat. Configure roles de menor privilégio. Se faltar acesso seguro, **não tente improvisar** e mantenha NO-GO.

## Preparação de provas

5. Gere o HTML estático com dependências lockadas e a SHA registrada. Execute auditorias F125 para inventário PT/EN/ES + hreflang, F129 para URLs antigas × destinos do HTML. Salve somente relatório sanitizado, sem despejar URLs.
6. Obtenha, por um canal privado e autorizado, um export GSC de páginas na propriedade correta, com paginação completa ou ressalva explícita, janela de datas final e nenhum identificador pessoal. **A integração do Portal com Google não pode ser presumida a partir do OpenSEO**.
7. Prepare um manifesto privado F127 de URLs antigas e mapeamentos 301 aprovados por equivalência de conteúdo. O operador deve coletar comprovantes HTTP HEAD/GET em um staging de identidade/TLS verificáveis. Não executar testes de carga, fuzzing, crawl em massa ou escrita no site de produção.
8. Em área privada temporária fora da árvore Git pública, crie o JSON F137 com exatamente `gscPageInput`, `migrationInput`, `httpCapture`, `buildDirectory`. Não usar dados reais no workflow público da PR.

## Comandos de conferência (somente leitura)

```bash
node scripts/review-municipal-build-offline.mjs /PRIVADO/inventario.json /PRIVADO/build https://DOMINIO-CANONICO-APROVADO/
node scripts/review-legacy-origin-migration-offline.mjs /PRIVADO/manifesto-legado.json
node scripts/review-gsc-page-origins-offline.mjs /PRIVADO/gsc-pages.json
node scripts/review-staging-http301-receipts-offline.mjs /PRIVADO/http-receipts.json
node scripts/review-migration-cross-evidence-offline.mjs /PRIVADO/cross-evidence.json
```

Inspecione as interfaces exatas dos scripts na SHA fixada antes de executar; este bloco ilustra a sequência, não deve ser copiado sem conferir o formato exigido por cada versão. Zero de exit code significa **candidato a revisão humana**, nunca deploy aprovado. 1 ou 2 = HOLD.

## Regras de aceitação e rollback

9. Verifique fontes GSC e rotas por serviço, destino 301, HTTP final 200, ausência de saltos, canonical/hreflang/sitemap/robots, exposição de prévias privadas e originalidade editorial. Nenhum número de cliques GSC deve ser reinterpretado como visita GA4, lead CRM ou cliente.
10. Faça teste de restauração e rollback no ambiente **isolado**, comprovando ausência de efeitos sobre CRM/Portal/Sites; preserve snapshots/dumps privados criptografados de acordo com política LGPD.
11. Emita relatório final com SHA, testes, contagens sanitizadas, diferenças, riscos e GO/NO-GO. Não inclua tokens, dados de clientes, IPs, hostnames privados ou conteúdo de requisições.
12. **Não fazer merge nem deploy automático.** A publicação de DNS/Nginx/Cloudflare/redirects, migrações permanentes e dados reais exige autorização humana específica, revisão independente AppSec/DBA/SEO e aceite de produto.

### Critérios impeditivos automáticos

Um dos gates F125/F129/F132/F135/F137 falhou; a propriedade GSC não está autorizada pelo tenant; a captura HTTP não comprova origem; o build de staging difere do HTML auditado; não há backup/restore/rollback; ocorrerá conflito de porta ou gasto novo não autorizado; conteúdo municipal carece de revisão editorial; ou há migrações sem auditoria. Em qualquer um desses casos, reportar **NO-GO** com próxima ação objetiva, sem alterar produção.
