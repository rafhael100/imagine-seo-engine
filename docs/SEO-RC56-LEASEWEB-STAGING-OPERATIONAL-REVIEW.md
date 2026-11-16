# Imagine SEO RC56 — geração segura de staging Leaseweb e Nginx real em laboratório

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida [RC55 #216](https://github.com/rafhael100/imagine-seo-engine/pull/216), [F147 #217](https://github.com/rafhael100/imagine-seo-engine/pull/217), [F148 #218](https://github.com/rafhael100/imagine-seo-engine/pull/218), [F149 #219](https://github.com/rafhael100/imagine-seo-engine/pull/219) e [F150 #220](https://github.com/rafhael100/imagine-seo-engine/pull/220). Toda a execução até aqui usou dados fictícios e infraestrutura descartável de CI.

## Avanços técnicos efetivos

| Entrega | Implementação concluída | Evidência de origem |
|---|---|---|
| F146 | Ensaio Nginx: config válida → config ruim BLOQUEADA → rollback exato por SHA → testes 301/GET aprovados | PR #215, 4/4 workflows PASS |
| F147 | Auditoria offline, fail-closed, de conflitos de porta/Compose/rede/volume e margem de memória/CPU, preservando a porta CRM 18081 | PR #217, 2/2 PASS |
| F148 | Coletor somente leitura do Docker **local Unix socket**, `ss -lnt`, `/proc/meminfo` e CPU, inventário privado 0600 fora do Git e relatório sanitizado; rejeita Docker remoto SSH/TCP | PR #218, 2/2 PASS |
| F149 | Gera Compose exclusivo a partir do inventário F147 e do Nginx **byte a byte idêntico** ao renderizador F145 para o build/manifesto; não inicia serviços | PR #219, 2/2 PASS |
| F150 | Sobe **o Compose gerado F149**, Nginx real com porta local e resource limits, em runner GitHub Actions descartável; F143 valida 2 redirects 301 e 2 páginas HTML idênticas | PR #220, 2/2 PASS |

**Esta RC56 só pode ser marcada CI validada depois dos workflows na própria SHA HEAD**, que são separados das evidências acima. O diff acumulado supera centenas de arquivos e requer revisão independente, não somente checklist e testes verdes.

## Roteiro técnico para Codex — execução supervisionada e sem interrupções desnecessárias

1. Inspecionar GitHub e congelar o SHA da RC56, registrar resultado dos workflows Node 22/24 e Docker Compose e revisar os diffs críticos de segurança, especialmente `labs/`, `scripts/`, CI e o Dockerfile/Compose.
2. Confirmar conectividade autorizada da **VPS Leaseweb correta** por identificação no painel e conta SSH do operador; nenhum conector GitHub prova acesso à VPS.
3. Coletar inventário **real**, sem escrita no Docker, com [F148](../docs/SEO-F148-READONLY-LEASEWEB-HOST-INVENTORY.md), escolhendo projeto/rede/volume e porta que não estejam em uso. Não usar 18081 (CRM) nem assumir que 18290 ou 18341 estão livres. Confirmar RAM, CPU, contêineres, redes, volumes e listeners por uma segunda verificação.
4. Documentar isolamento Docker Compose, memória/CPU/PIDs, filesystem e binds somente leitura, interface host 127.0.0.1, firewall/egress e usuário sem privilégio. Não reutilizar/alterar contêiner, rede, volume ou dados de CRM, Portal, Sites e demais sistemas.
5. Preparar **build estático real, editorialmente revisado**, com rotas/municípios oficiais, PT/EN/ES, canonical/hreflang/sitemap, sem conteúdo duplicado/doorway. Confirmar SHA do commit e do build e exigir F125/F128/F140.
6. Obter manifesto 301 privado com equivalência de intenção e conteúdo, origens HTTP/www e traduções aprovadas; entradas de páginas GSC **apenas sob grant real por tenant** e consentimento adequado. Nunca salvar no repositório público nem em logs CI.
7. Executar F145 com o manifesto/build, produzindo arquivo de Nginx privado fora do Git. Em seguida rodar F149 com inventário F148, manifesto, build e configuração Nginx gerada, para criar Compose privado.
8. **Antes de subir serviços:** revisar `docker compose -f ... config`, permissões, imagem Nginx digest/CVEs/SBOM, Docker e firewall; registrar baseline, backups recuperáveis e ensaio de rollback. A F149 não é autorização de instalação.
9. Se e somente se o staging exclusivo estiver aprovado, exercitar F143 em porta loopback realmente implantada, verificar 301/GET/HTML SHA, monitorar recursos e conduzir rollback F146. Não interpretar simulação `X-Forwarded-Proto` como TLS público ou prova de segurança.
10. Consolidar evidências sanitizadas (SHA, resultados, riscos, bloqueios) e submeter **separadamente** TLS/SNI público, Cloudflare, GSC OAuth, LGPD, revisão AppSec/SEO/DBA, segurança municipal e autorização humana para eventual merge/publicação.

### Comandos privados — exemplos, nunca executar cegamente

```bash
SEO_F148_LOCAL_INVENTORY=YES_READ_ONLY_DOCKER_HOST \
node labs/seo-f148-docker-host/capture-readonly-host.mjs \
 --project seo-staging-exclusivo \
 --network seo-rede-exclusiva \
 --volume seo-volume-reservado \
 --port PORTA-LIVRE \
 --memory-mib 512 --cpus 1 \
 --out /AREA-PRIVADA/inventory.json --read-only-local-host

node scripts/render-private-nginx-staging-config.mjs \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --out /AREA-PRIVADA/nginx-staging.conf

node scripts/render-private-staging-compose.mjs \
 --inventory /AREA-PRIVADA/inventory.json \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --nginx-conf /AREA-PRIVADA/nginx-staging.conf \
 --out /AREA-PRIVADA/compose-staging.yml

docker compose -f /AREA-PRIVADA/compose-staging.yml config
```

`PORTA-LIVRE` é um marcador e deve ser substituído por inteiro **comprovadamente** não usado. Não colar relatórios que contenham nomes de serviços/URLs reais em PR público. `docker compose config` é inspeção e **não** sobe contêiner. O acesso e a homologação na VPS ainda precisam de execução autorizada pelo operador/Codex com os pré-requisitos comprovados.

## Estado e limites

- Nenhuma migração de banco, publicação DNS/Cloudflare, importação Google real, mudança de `main`, deploy na Leaseweb, cobrança ou tratamento de leads foi executado nesta linha.
- `human_*_review_required` não equivale a GO de produção. Snapshot do host pode ficar obsoleto entre captura e execução; revalidar o listener real.
- CI sintética comprova o desenho dos controles, não conformidade de TLS/SSRF, isolamento efetivo de rede, autorização Google por empresa ou equivalência editorial de conteúdo.
- A imagem Docker do laboratório é fixada por SHA para repetibilidade, **não declarada livre de vulnerabilidades para produção**.

**Status: HOLD — prontidão de laboratório em evolução; homologação real na Leaseweb ainda não comprovada.**
