# SEO F198 — segundo modo Docker: rede interna SEM porta publicada

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Decisão técnica baseada no teste real do Docker

A primeira tentativa de aplicar `internal: true` **diretamente ao Compose F149 que publica `127.0.0.1:<porta>:8080`** produziu regressão nas execuções reais Docker F150/F151/F152/F197. Diagnóstico no runner: `HostConfig.PortBindings` manteve os valores pedidos, mas `NetworkSettings.Ports` deixou de expor o mapeamento, e uma requisição HEAD real em `127.0.0.1` **falhou**. Portanto, o modo de staging F149 com porta loopback, Nginx e auditoria F143 deve permanecer **inalterado e funcional**. Não podemos contornar a falha relaxando a verificação de porta do F151.

A F198 implementa **um modo complementar sem NENHUMA porta publicada** para verificar a possibilidade de isolar completamente a rede e de ainda servir o HTML F348 dentro do container. Não pretende substituir F149/F197.

## Contrato de rede interna separada

A nova ferramenta CI `labs/seo-f198-internal-noport/run-f348-internal-noport.mjs`:

1. Só executa no runner descartável GitHub Actions, com `CI=true`, `GITHUB_ACTIONS=true`, `APP_ENV=testing` e `SEO_F198_INTERNAL_LAB=YES_NO_PUBLISHED_PORTS`.
2. Faz checkout do Comercial F348 por SHA `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444` e compila Astro PT/EN/ES real.
3. Gera um Compose válido F149 a partir da configuração Nginx F145, das URLs de redirecionamento sintéticas e do build HTML real. **Apenas em laboratório**, modifica uma ocorrência exata do YAML gerado para retirar `ports` e adicionar `internal: true` na bridge exclusiva. Não aceita YAML arbitrário nem manifestos privados externos.
4. O Docker valida a sintaxe, inicia Nginx não-root com filesystem e mounts somente leitura, sem capabilities, orçamento CPU/memória e rede interna sem rota de saída padrão, com **zero published host ports**.
5. `docker network inspect` e um revisor puro F198 conferem driver `bridge`, `Internal=true`, `Attachable=false`, IPv6 desativado, escopo `local` e **um único container identificado**. `docker inspect` comprova `PortBindings` vazio, runtime saudável e todos os controles F151 **exceto o requisito de publicação de porta**, que deve FALHAR exatamente porque este é o modo privado sem port binding. Nenhum outro bloqueio F151 pode ser aceito.
6. Para comprovar funcionamento sem acesso externo, lê **os três documentos HTML F348 a partir de GET com `docker exec wget` na rede loopback DENTRO do container** e compara byte a byte com o build local. A CLI nunca imprime URLs, caminhos, IPs, IDs de container ou bytes de documentos.
7. Executa `docker compose down --volumes` e apaga a pasta temporária no runner.

## Diferença entre os dois ensaios

| Modo | Rede | Porta publicada | Prova HTTP |
|---|---|---|---|
| F149/F150/F197 | Bridge isolada por nome | Uma porta **127.0.0.1** | HEAD 301 e GET HTML pelo **host** |
| F198 complementar | Bridge `internal:true` | **Nenhuma** | GET HTML via **docker exec** dentro do container |

A primeira modalidade é útil para QA de acesso local e a segunda, para validar isolamento interno sem tráfego ingress/egress host. **Nenhuma delas valida TLS, firewall ou rede de produção na Leaseweb.** Inspecionar o flag `Internal` não é um teste ativo de pacotes de saída; não alegar prova completa de bloqueio de egress.

O status segue `HOLD`: GSC OAuth/tenant reais, AppSec/LGPD independente, Leaseweb staging autorizado, TLS/301 públicos controlados, backup/restauração, rollback e GO humano ainda são necessários.

Base: [F197 #296](https://github.com/rafhael100/imagine-seo-engine/pull/296) e [RC74 #295](https://github.com/rafhael100/imagine-seo-engine/pull/295).
