# SEO F147 — gate offline de isolamento de staging na VPS Leaseweb

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da RC54 [#214](https://github.com/rafhael100/imagine-seo-engine/pull/214) e do rollback funcional F146 [#215](https://github.com/rafhael100/imagine-seo-engine/pull/215).

## Motivo

Os testes CI de Nginx não comprovam que uma porta, nome de contêiner, volume ou rede esteja livre **na VPS real**. Também não comprovam que há margem de memória e CPU. A F147 evita que uma amostra de Docker Compose seja tratada como pronta sem uma auditoria explícita de conflitos.

`reviewIsolatedSeoStagingInventory(input)` é um revisor *puro*, somente leitura, de um **inventário fornecido pelo operador**, no seguinte formato. Os valores abaixo são sintéticos:

```json
{
  "sourceType":"operator_supplied_docker_host_inventory_unverified",
  "requested":{
    "composeProject":"seo-private-staging",
    "networkName":"seo-private-network",
    "volumeName":"seo-private-volume",
    "loopbackPort":18313,
    "memoryLimitMiB":512,
    "cpuLimit":1
  },
  "host":{
    "availableMemoryMiB":13000,
    "totalCpu":8,
    "snapshotComplete":true
  },
  "existing":{
    "containerNames":["crm-example"],
    "networkNames":["crm-example-network"],
    "volumeNames":["crm-example-data"],
    "listeningPorts":[18081,18082],
    "publishedPorts":[18081]
  }
}
```

Os nomes, valores de RAM e portas são **exemplos**, não inventário atual da Leaseweb. O revisor proíbe a porta conhecida `18081` e qualquer conflito reportado com serviços existentes. Detecta sobreposição do namespace Compose, nome de rede/volume, recursos insuficientes e inventário que o próprio operador marcou como incompleto. Exige recursos limitados, margem mínima de 4 GiB de RAM disponível após reserva, pelo menos metade da CPU preservada e identificadores distintos.

## Comando

Guardar um inventário privado em arquivo regular fora do repositório público:

```bash
node scripts/review-staging-docker-inventory-offline.mjs /AREA-PRIVADA/host-inventory.json
```

O comando nunca conecta ao Docker, não consulta a VPS, não abre sockets nem executa Compose. O relatório mostra apenas contagens/flags, nunca nomes de contêineres, portas, caminhos, IPs ou endereços de clientes. Código `0` significa apenas **revisão humana exigida**, `2` indica risco/bloqueio e `1` entrada inválida. Os testes usam exclusivamente nomes de exemplo e dados sintéticos.

## Gates que precisam ser comprovados pelo Codex na VPS

1. Capturar inventário **real e atual** de `docker ps`, `docker network ls`, `docker volume ls`, `ss -lnt` e memória/CPU, sem copiar credenciais ou variáveis de contêiner.
2. Confirmar que o mesmo usuário autorizado controla o host e que nenhuma porta está bloqueada apenas por um listener não listado ou por firewall/NAT. `snapshotComplete=true` **é declaração não autenticada**, não prova.
3. Obter aceite de limite de recursos, diretório privado, nomes exclusivos de Compose, rede, volumes, porta de loopback e backups; não modificar CRM, Sites ou Portal.
4. Só executar testes de Nginx real na VPS depois de inventário, isolamento, autorização, cadeia do build, identidade do proxy, plano de rollback, análise AppSec e evidências de consumo.
5. Para produção, verificar separadamente GSC real autorizado por tenant, equivalência editorial de redirects, IBGE, TLS/SNI/Cloudflare e consentimento LGPD.

A F147 não reserva a porta; mesmo um relatório sem bloqueios pode sofrer corrida entre verificação e implantação. Repetir o inventário no momento da homologação e testar o listener efetivo antes de prosseguir. Nenhum dado privado deve ser versionado no GitHub.

**Status: HOLD; nenhuma alteração na VPS, DNS, Google ou `main`.**
