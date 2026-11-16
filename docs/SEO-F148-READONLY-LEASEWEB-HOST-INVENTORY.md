# SEO F148 — coletor somente leitura de inventário Docker **local**

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Complementa [F147 #217](https://github.com/rafhael100/imagine-seo-engine/pull/217) e não pressupõe acesso remoto à VPS Leaseweb.

## O problema resolvido

A F147 confere conflito de portas e isolamento, mas exige um JSON privado do operador. A F148 constrói esse JSON **na máquina em que for explicitamente executada**, usando apenas operações de consulta:

- `docker context inspect --format '{{.Endpoints.docker.Host}}'`: exige endpoint Docker **local Unix socket**; recusa SSH/TCP/endpoint remoto;
- `docker container ls --all --format '{{.Names}}'`: nomes de contêineres existentes;
- `docker network ls --format '{{.Name}}'` e `docker volume ls --format '{{.Name}}'`: nomes de recursos existentes;
- `docker ps --all --format '{{.Ports}}'`: portas de host publicadas;
- `ss -H -lnt`: sockets TCP que estão ouvindo, em qualquer interface;
- `/proc/meminfo` (`MemAvailable`) e CPU do sistema pelo Node: estimativas de capacidade.

As execuções usam `execFile` sem shell e argumentos constantes, com timeouts e buffer limitados; **não** fazem `docker inspect` de variáveis/segredos, `docker compose up/down`, SSH, curl, login ou deploy. A coleta gera arquivo **privado 0600**, fora do Git, com nomes de serviços; o stdout mostra somente o relatório sanitizado F147.

## Exemplo de execução pelo Codex/operador na Leaseweb

Este exemplo **não** foi executado na VPS; o operador deve escolher nomes e porta comprovadamente adequados:

```bash
SEO_F148_LOCAL_INVENTORY=YES_READ_ONLY_DOCKER_HOST \
node labs/seo-f148-docker-host/capture-readonly-host.mjs \
  --project seo-projeto-isolado \
  --network seo-network-isolada \
  --volume seo-dados-isolados \
  --port 18293 \
  --memory-mib 512 \
  --cpus 1 \
  --out /AREA-PRIVADA/inventory.json \
  --read-only-local-host
```

**Aviso:** `18293` é só exemplo, não uma porta reservada. O comando necessita do Docker CLI, `ss`, Linux `/proc/meminfo`, permissão do operador para consultar o Docker local e um diretório de saída privado já criado. A conta usada deve estar autorizada a consultar o Docker; membros do grupo Docker podem ter privilégios administrativos no host e devem ser controlados.

Código de saída: `0` = inventário e critérios conservadores compatíveis **para revisão humana**; `2` = conflito/recurso insuficiente; `1` = entrada, acesso, contexto ou coleta inválida. Não cria contêiner, não reserva porta, não autentica a identidade física da VPS. Refazer imediatamente antes do próximo ensaio autorizado.

## Segurança e limites

- Um Unix socket pode ter sido montado de outro host ou encaminhado. `unix://` comprova somente o endpoint do cliente, **não** autentica a VPS; o operador precisa conferir a identidade da máquina no painel Leaseweb.
- O parser recusa dados truncados, excessivos, ambiguidades de porta e informações fora do contrato F147. Não armazena IPs, nomes em logs nem IDs de empresa.
- O arquivo privado contém nomes de serviços existentes e deve permanecer no host, com acesso mínimo e política de retenção. Não comitar em GitHub, publicar como artefato CI ou enviar ao chat.
- A CI usa **apenas amostras fictícias** de saída Docker/ss, testando detecção de conflitos e recusas; não pode declarar que a VPS real está livre ou segura.
- O relatório `human_host_inventory_review_required` **não** autoriza deploy. Exige review AppSec, comparação do inventário com Portainer/operador, backup/restauração, reversão, confirmação de recursos, rede isolada e aprovação humana.

O CRM, Sites, Portal, outras aplicações, DNS e `main` permanecem intactos.
