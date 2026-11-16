# SEO F138 — teste HTTP real somente em loopback, sem acesso à produção

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC50 #199](https://github.com/rafhael100/imagine-seo-engine/pull/199) e o gate de recibos F134/F135.

## Lacuna que fecha

Os recibos F134/F135 eram JSONs sintéticos ou fornecidos pelo operador, sem qualquer teste real do protocolo HTTP. F138 executa **HEAD HTTP de verdade** contra um proxy autorizado escutando **somente em `127.0.0.1`**, inclusive em testes CI que abrem um servidor local descartável. Não executa DNS público, não segue redirects e não toca TLS ou site de produção.

### Contrato de biblioteca

`probeLoopbackLegacyRedirects({migrationInput,loopbackPort})`

- Exige `SEO_F138_ALLOW_LOCAL_HEAD=1` definido intencionalmente pelo operador.
- `loopbackPort` deve ser porta local 1024–65535, um serviço aprovado e **isolado**; não ler porta ou destino a partir de resposta HTTP.
- O destino TCP é sempre `127.0.0.1`, codificado no módulo e sem interpolação de endereço externo. `Host` representa somente o host legado ou canônico do manifesto F127.
- No máximo 100 candidatos por execução, sem headers de cookie, token ou corpo de requisição; `HEAD` e timeout de 2,5 segundos por chamada.
- Faz uma chamada ao caminho legado e, **somente se `Location` for idêntico à URL canônica planejada**, consulta o caminho final **no mesmo loopback**. Nunca segue `Location` externo.
- Confere resposta de origem 301, um único salto e HEAD final 200; falhas retornam somente contagens e códigos de diagnóstico do F134.
- **Não comprova HTTPS/TLS público**, DNS, identidade do staging, equivalência editorial, posição do Google, configuração do Nginx de produção nem migração autorizada.

### Testes integrados

Node 22/24 iniciam um servidor HTTP descartável em porta efêmera `127.0.0.1`. Testes incluem 301 e página final 200, 302 indevido, hop duplo, tentativa de destino externo (sem ser seguido), host não listado, porta privilegiada e ausência da autorização explícita. O resultado não revela `example.test` ou caminho privado.

### Limites de segurança

Antes de usar em uma VPS, inventariar os contêineres, portas e serviços existentes e confirmar que o proxy local alvo é realmente o serviço de staging aprovado. Nunca escanear portas, nunca testar um serviço de terceiros e nunca promover um teste local a aprovação de deployment.

**Gate de produção ainda é HOLD**: capturas TLS verdadeiras de staging, autenticação Google/tenant, equivalência 301 página a página, certificados, backup/restauração e rollback, revisão independente e aceite humano.
