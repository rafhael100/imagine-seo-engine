# SEO F152 — prova negativa real de desvio de limites no Docker

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Evolui a auditoria real [F151 #222](https://github.com/rafhael100/imagine-seo-engine/pull/222), não modifica o host Leaseweb.

## Por que criar mais um teste?

Testes unitários adversariais da F151 comprovavam que o auditor rejeita JSON de contêiner incorreto. A F152 completa o ciclo: faz um **Nginx real** subir com um recurso diferente do aprovado e prova que o auditor enxerga essa diferença no retorno real de `docker inspect`.

## Fluxo no runner descartável do GitHub Actions

1. Compila o site fictício `example.test`, manifesto GSC e regras 301, gera Nginx F145 e Compose F149, usando apenas recursos efêmeros.
2. Inicia o contêiner configurado corretamente (512 MiB RAM, 1 CPU, porta local) e executa F151 (Docker inspect real) e F143 (301 e bytes HTML). Ambos precisam passar.
3. Desliga **somente o projeto descartável** criado pelo próprio teste. Em uma nova configuração isolada, altera propositalmente **apenas** o limite de memória de `512m` para `768m`, preservando porta loopback, usuário, mounts read-only, ausência de privilégios, PIDs, rede própria e tag/digest de imagem.
4. Sobe novamente **o contêiner descartável** com o limite errado. F151 recebe o mesmo contrato esperado (512 MiB) e deve responder `blocked` com `cpu_memory_or_pid_limit_drift`, sem publicar, sem validar GSC e sem expor o inspect bruto.
5. Encerra o Nginx adversarial e apaga os fixtures. Se o desvio não for detectado, falha a CI.

**Esse teste só roda com `GITHUB_ACTIONS=true`, `CI=true`, `APP_ENV=testing` e opt-in de loopback.** Não foi desenvolvido como ferramenta de teste de produção. Não copiar o Compose deliberadamente incorreto para staging real.

## Limitações e controle de risco

F152 prova que o contrato de **memória de um Nginx de laboratório** é auditável contra o Docker real. Não verifica uso de RAM real sob carga nem garante isolamento de egress, CVEs de imagem, identidade da VPS, TLS público, GSC OAuth por empresa, qualidade editorial municipal ou rollback de volume e banco.

As mesmas obrigações pendentes permanecem: revisão independente AppSec/SEO/DBA, SHA do build, inventário atualizado Leaseweb, autorização de acesso, backup/restore, firewall e contenção dos serviços CRM/Portal/Sites, segredos privados, conteúdo municipal original e aprovação humana de merge/deploy.

**Status NO-GO para produção mesmo com CI verde.**
