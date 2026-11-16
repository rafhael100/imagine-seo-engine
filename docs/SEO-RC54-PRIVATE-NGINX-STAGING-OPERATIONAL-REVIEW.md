# Imagine SEO RC54 — configuração Nginx privada derivada das regras 301 aprovadas

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida RC53 [#212](https://github.com/rafhael100/imagine-seo-engine/pull/212) e F145 [#213](https://github.com/rafhael100/imagine-seo-engine/pull/213).

## Resultado funcional auditado

- Auditoria municipal PT/EN/ES, HTML real, canonical/hreflang/sitemap e fonte IBGE sob gates.
- GSC por página versus URLs legadas, 301 canônicos, auditoria de destino no HTML compilado e CLI de relatório redigido.
- F138–F143: HEAD 301 e GET de HTML por loopback, conferência SHA-256 do diretório completo, estabilidade entre início/fim e equivalência dos bytes servidos.
- F144: testes reais em Nginx Docker Compose isolado com portas locais dinâmicas; cenário adversarial de header SHA correto e página incorreta é bloqueado.
- **F145:** configuração Nginx de staging renderizada **do próprio manifesto F127 validado** após F128, e exercitada no mesmo Nginx real. Elimina transcrição manual dos aliases do lote (limite conservador 80 rotas). O arquivo de configuração fica privado e fora da árvore Git.

## CI comprovada antes desta RC

- RC53: **27/27 workflows SUCCESS** na SHA `f06da4b8d056d522a0be508f1d81820f8d59e28b`.
- F145: **3/3 workflows SUCCESS**, incluindo regressões offline, Nginx Docker Compose real e suíte Node 22/24, na SHA `2af62dbdde2872edb26a02b7f018cac4265f10cd`.
- RC54: requer CI completa na **nova HEAD** e inventário paginado antes de revisão de release.

## Especificação para Codex/operador Leaseweb (NÃO executar sem controles)

1. **Inspecionar inventário** de contêineres, redes, portas e volumes na VPS, incluindo CRM, Sites e Portal. Nenhum serviço existente pode ser parado ou sobrescrito; nunca presumir a porta 18290 livre.
2. **Snapshot/rollback:** comprovar espaço, backup seguro, restore e rollback testado do staging exclusivo, com projetos Docker Compose/volumes/portas de nomes independentes.
3. **Material imutável:** usar a SHA exata RC54, Node 22/24 e dependências lockadas; construir o HTML de staging real; validar F125 e F128 contra inventário de páginas e as rotas aprovadas, proibindo prévias/noindex incorreto.
4. **Insumos privados:** receber manifesto legado 301 F127 revisado por equivalência editorial e GSC `page` export com consentimento/tenant/grant. Nunca comitar export, URL histórica privada, token, IP, cookies ou headers no GitHub público.
5. **Renderizador Nginx:** gerar a configuração exclusivamente de uma cópia privada do manifesto pelo comando:
```bash
node scripts/render-private-nginx-staging-config.mjs \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --out /AREA-PRIVADA/nginx-staging.conf
```
6. **Proxy isolado:** o Docker Compose F144 é fixture de CI; se for adaptado para staging, atualizar digest Nginx, fazer revisão AppSec de permissões, egress/firewall, mount/portas, logs e TLS, sem reproduzir automaticamente `X-Forwarded-Proto` de fonte não confiável. Nunca assumir que um header SHA comprova identidade.
7. **Gate integrado:** no proxy de staging autorizado, executar:
```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/run-served-html-staging-qa.mjs \
 --gsc /AREA-PRIVADA/gsc-pages.json \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --out /AREA-PRIVADA/http-receipts.json \
 --port PORTA_COMPROVADAMENTE_LIVRE --enable-loopback-probe
```
8. **GO técnico restrito:** resultado `0` é candidato a revisão humana, `2` bloqueado, `1` erro. Exigir entrega de relatório com SHA, testes e contagens sanitizadas, evidências privadas protegidas, mapeamentos e prova de backup/rollback, sem declarar produção liberada.
9. **Publicação real:** TLS/SNI público, Cloudflare/DNS, verificação do comportamento GET/HEAD externo, GSC autorizado por tenant, IBGE, conteúdo regional útil, segurança independente e aceite humano específico. Sem isso, status **NO-GO** e VPS/produção ficam intactas.

## Riscos ainda materiais

- `X-Forwarded-Proto` no laboratório é uma **simulação controlada**, não prova de TLS real nem definição segura de proxy-trust em produção.
- O Compose usa bridge privada de projeto com porta apenas loopback, mas pode haver egress; precisa de firewall/isolamento revisado se for reproduzido no host multiempresa.
- Imagem Nginx foi fixada por SHA para reprodutibilidade em CI; não usar essa versão em produção sem scanner de vulnerabilidades e atualização.
- O GSC conectado ao OpenSEO não equivale ao Portal ter OAuth/consentimento/grant por tenant.
- O histórico tem centenas de arquivos; revisão de paths paginada não substitui AppSec/DBA/SEO dos diffs.

**Esta RC54 ainda não instalou Nginx na Leaseweb, alterou DNS, conectou Google, fez merge nem publicou o site.**
