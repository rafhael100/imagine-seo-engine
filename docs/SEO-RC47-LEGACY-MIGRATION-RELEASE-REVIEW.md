# Imagine SEO RC47 — revisão consolidada de migração e segurança multilíngue

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY — 15/11/2026.**

Candidato integrado a partir da RC46 [#183](https://github.com/rafhael100/imagine-seo-engine/pull/183), acrescido de:
- [F127 #184](https://github.com/rafhael100/imagine-seo-engine/pull/184): manifesto privado e verificador offline para URLs HTTP/HTTPS, www/apex, prefixos de idioma legados `/en-us/` e propostas de redirecionamento 301.
- [F128 #185](https://github.com/rafhael100/imagine-seo-engine/pull/185): confrontar cada destino declarado com o **HTML realmente compilado**; verificar canonical, root lang, robots, sitemap e prévia editorial privada.
- [F129 #186](https://github.com/rafhael100/imagine-seo-engine/pull/186): CLI read-only operacional com manifesto privado e diretório de build, códigos 0 = revisão humana, 1 = entrada inválida, 2 = correções obrigatórias.

## O que funciona

O núcleo SEO das F0–F126 permanece ativo na branch: auditorias, inventários PT/EN/ES, hreflang obrigatório por grupo territorial, assinatura Ed25519 v2 CI-only, importação e análise offline de GSC e controles de origem IBGE.

Para migração de domínio e versão de idioma, F127–F129 reutilizam o auditor real e recusam URL externa, parâmetros suspeitos, destino não compilado, desvio de idioma, rotas não presentes no sitemap e HTML privado. Não cria ou aplica regras 301.

Evidências das branches:
- F127: [CI](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43791504880) **SUCCESS**; Node 22/24.
- F128: [CI](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43791785548) **SUCCESS**; Node 22/24.
- F129: [CI](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43792042002) **SUCCESS**; Node 22/24.

## Uso em staging futuro

```bash
node scripts/review-legacy-migration-build-offline.mjs \
  /CAMINHO/PRIVADO/manifesto.json \
  /CAMINHO/BUILD/STATIC > /CAMINHO/PRIVADO/resultado.json
```

Nenhum dado de GSC, domínio de cliente, credencial, conteúdo, URL sensível, caminho privado ou nome de contato deve ser versionado no repositório público. O manifesto privado necessita revisão de equivalência página a página.

## Pendências que impedem publicação

1. **Revisão independente do diff completo** de centenas de commits herdados. Comparações resumidas do GitHub podem truncar a relação de arquivos; consultar inventário de nomes paginado e todos os diffs relevantes.
2. Confirmar domínio canônico final, origens legadas www/HTTP, semântica de /en-us/ versus /en/, preservação de backlinks e URLs indexadas.
3. Homologação isolada da VPS Leaseweb, DNS/Cloudflare/Nginx e testes de respostas 301 reais, sem chains/loops; backup e rollback devem ser ensaiados antes de publicação.
4. IBGE oficial, QA editorial e atendimento local verdadeiros antes de publicar conteúdo territorial; evitar conteúdo doorway/massificado.
5. Portal RC50 [#896](https://github.com/rafhael100/imagine-portal/pull/896): autenticação multiempresa, consentimento e grants verdadeiros, custódia de chaves, revogação/retenção, LGPD/AppSec/DBA, integração GSC readonly real e aceite explícito de produção.

**Nenhum merge automático, deploy, alteração de DNS, cobrança ou dado de cliente foi realizado nesta branch.**
