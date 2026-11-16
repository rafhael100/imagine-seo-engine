# Imagine SEO RC57 — auditoria de isolamento real e ensaio de divergência Docker

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida [RC56 #221](https://github.com/rafhael100/imagine-seo-engine/pull/221), [F151 #222](https://github.com/rafhael100/imagine-seo-engine/pull/222) e [F152 #223](https://github.com/rafhael100/imagine-seo-engine/pull/223), preservando a linha anterior F108–F150 e o fluxo de revisão humana.

## O que mudou de fato

Até RC56, os testes provavam que o Nginx Docker Compose gerado por F149 iniciava em GitHub Actions, servia conteúdo HTML igual ao build validado e respondia 301 aos endereços legados. A RC57 adiciona uma verificação de **configuração realmente aplicada pelo Docker**:

- **F151:** inspeciona o contêiner real após o startup de um runner GitHub Actions descartável. Cruza imagem declarada com digest SHA, usuário 101:101, ausência de privilégios, rootfs read-only, capabilities, `no-new-privileges`, memória/CPU/PIDs, mounts read-only de HTML/config, `/tmp` restrito, rede exclusiva, política de restart e **única porta publicada em `127.0.0.1`**. Não confunde portas `EXPOSE` não publicadas com sockets efetivos; portas publicadas adicionais são bloqueadas.
- **F152:** executa um **segundo contêiner Nginx real** de CI, no mesmo projeto descartável após desligar o primeiro, alterando propositalmente memória aplicada de 512 para 768 MiB. O contrato aprovado permanece 512 MiB; F151 deve responder `blocked` por `cpu_memory_or_pid_limit_drift`. Os recursos são eliminados ao final.
- Ambos preservam política de **zero acesso à rede** nos módulos offline e não revelam `docker inspect` bruto, env, ID, IP, nomes privados ou caminhos em logs/PR.
- Nenhum dado Google/IBGE de produção, DB, token, server ou cliente real participa desses testes.

## Evidências verificadas

| Candidato | HEAD de CI | Validação |
|---|---|---|
| RC56 [#221](https://github.com/rafhael100/imagine-seo-engine/pull/221) | `adf9027ddba8e25c253c6f1e6e3a948b02ecdfdc` | **33/33 workflows SUCCESS** |
| F151 [#222](https://github.com/rafhael100/imagine-seo-engine/pull/222) | `f4cb031f8aa29a5470b1d31d4cf83916454a7bc7` | **3/3 SUCCESS**, incluindo Nginx/Docker real |
| F152 [#223](https://github.com/rafhael100/imagine-seo-engine/pull/223) | `3ea5b6ff81e480fd1cdd52f40fa540dddcea49d6` | **4/4 SUCCESS**, incluindo teste adversarial Docker real |

A RC57 requer **nova CI na própria HEAD** e revisão independente dos arquivos acumulados. Testes de laboratório são evidência técnica, não autorização de publicação.

## Próxima etapa operacional — sem interrupção dos outros projetos

1. **Auditoria técnica da PR consolidada:** revisar workflows, `src/`, `scripts/`, `labs/`, contratos de privacidade, executores Docker e cadeia de dependências. Conferir diffs paginados e mudanças pós-CI.
2. **VPS correta:** usuário/operador deve autenticar a identidade Leaseweb da máquina e coletar inventário somente leitura F148 *no host autorizado*. A integração GitHub não fornece acesso remoto SSH automaticamente.
3. **Isolamento real:** validar `docker ps`, `ss -lnt`, rede/volumes e recursos, preservando CRM, Sites, Portal e demais sistemas. Conferir porta única livre, TCP loopback, não reutilizar listener de CRM.
4. **Staging separado:** congelar SHA do build, verificar conteúdo original municipal/IBGE, idiomas e links hreflang/canonical, manifesto privado 301 e GSC por tenant/grant/consentimento.
5. **Infra segura:** atualizar e auditar imagem Nginx/SBOM/CVEs, restringir egress/firewall, configurar TLS/SNI do ambiente autorizado, comparar Compose F149 com o estado realmente aplicado F151 e operar rollback F146 na VPS somente após plano seguro.
6. **Revisão e liberação:** reexecutar F141/F143 em ambiente controlado e depois testar HTTP/HTTPS público autorizado separadamente. Exigir backup/restore e revisão AppSec/SEO/DBA/LGPD, homologação dos serviços reais, GO humano específico antes de merge, publicação, mudança DNS ou dados de cliente.

## Limites que continuam relevantes

- A rede bridge exclusiva de CI **não é prova de ausência de egress**. A F151 valida apenas o nome e o modo de rede reportados pelo Docker; cabe ao time de infraestrutura verificar firewall e roteamento efetivo.
- A imagem Nginx está fixada por digest para reproduzir o laboratório; isso **não comprova** que está atualizada ou sem vulnerabilidades para produção.
- `X-Forwarded-Proto` de laboratório e o header de build não autenticam o TLS/SNI público, a origem, o Google nem o próprio host.
- A porta selecionada por F148 não fica reservada, e o inventário pode envelhecer entre leitura e execução.
- A reversão F146 recupera **configuração descartável de laboratório**, não um banco de dados ou DNS real.
- GSC/Google e IBGE oficiais precisam ser autenticados e o conteúdo deve ser original/relevante; não liberar páginas de cidades geradas sem qualidade.

**Status: HOLD.** Nada foi implantado na VPS Leaseweb, nenhum serviço foi interrompido, e `main`, DNS, Cloudflare, Google real, cobrança e clientes permanecem inalterados.
