# SEO F198 — rede Docker interna obrigatória para o staging Nginx

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Risco real corrigido

O Compose de staging F149 já restringia o Nginx por container não-root UID 101, filesystem `read_only`, capacidades removidas, orçamento de CPU/memória, volumes somente leitura e uma porta publicada exclusivamente em `127.0.0.1`. Entretanto, a rede `bridge` privada era separada apenas pelo **nome da rede**: não estava configurada como `internal`, permitindo rotas de saída que o staging de HTML estático não precisa utilizar.

A F198 acrescenta `internal: true` na rede do Docker Compose, impedindo o acesso externo roteado via bridge segundo a semântica de rede interna do Docker, sem alterar a interface de loopback publicada nem a política de arquivos privados.

## Verificação independente da configuração e runtime real

Os testes F149 exigem agora a declaração YAML `internal: true` e validam o Compose com o parser real do Docker. Os laboratórios F150 e F197 — que iniciam efetivamente Nginx em Docker num runner descartável — passam a consultar **`docker network inspect` diretamente do daemon**.

O revisor puro `reviewInternalStagingDockerNetwork` aceita uma única rede com nome esperado, driver `bridge`, escopo `local`, `Internal=true`, `Attachable=false`, `Ingress=false`, IPv6 desligado e **exatamente o container Nginx esperado**; rejeita containers extras, rede compartilhada com CRM ou propriedades inconsistentes. Nunca devolve endereços IP, nomes de containers, ID de rede, host Docker, tokens ou caminhos privados.

A CI executa cenários adversariais, além de:
- F150: Compose gerado e iniciado de verdade com HTML de laboratório, verificação F143, auditoria F151, teste de alteração de memória F152 e shutdown.
- F197: Comercial F348 real servido por Nginx Docker de rede interna, HEADs HTTP 301 e respostas GET HTML idênticas aos arquivos Astro PT/EN/ES.

## Limites da comprovação

O `docker network inspect` comprova a propriedade declarada e implementada **naquele daemon descartável**, mas não realiza teste ativo de pacotes e não autentica firewall da VPS. O resultado distingue `dockerInternalNetworkFlagObserved=true` de `livePacketEgressTestPerformed=false`.

Ainda faltam inventário autenticado de redes e portas na Leaseweb, validação de ingress/TLS, rollback, backup/restauração, OAuth GSC readonly por tenant/consentimento, AppSec/LGPD independente e GO humano. **Não há deploy ou alteração de rede na VPS em decorrência desta PR.**

Base: [F197 #296](https://github.com/rafhael100/imagine-seo-engine/pull/296) (2/2 CI SUCCESS) e [RC74 #295](https://github.com/rafhael100/imagine-seo-engine/pull/295) (65/65 CI SUCCESS).
