# SEO F138 — captura HTTP HEAD real, mas restrita ao loopback de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC50 #199](https://github.com/rafhael100/imagine-seo-engine/pull/199). Ao contrário de F134–F137, F138 efetua **requisições HTTP reais**, porém somente a `127.0.0.1` (porta explícita) em um reverse proxy dedicado de staging; jamais consulta DNS público, Google, VPS remota ou produção por iniciativa própria.

## Finalidade e segurança

Uma revisão de comprovantes informados manualmente não demonstra que o proxy responde realmente. F138 cria comprovantes HEAD pela rede **local**, exercitando um proxy previamente iniciado em contêiner isolado. Cada URL legada F127 é testada por meio de:

- Conexão TCP ao endereço fixo `127.0.0.1`, porta entre 1024–65535;
- Cabeçalho `Host` da URL legada já validada pelo contrato F127;
- Cabeçalho `X-Forwarded-Proto` com o esquema lógico HTTP/HTTPS de origem, **apenas para simulação controlada**;
- HEAD de origem, sem seguir o `Location` retornado (evita SSRF/open redirect);
- HEAD adicional no destino canônico **aprovado pelo manifesto**, sempre via o mesmo loopback;
- Inferência de um salto apenas se a origem responder 3xx e o destino não redirecionar; se destino redireciona, sinaliza segundo salto para bloqueio;
- Sem cabeçalhos de autenticação, cookies, corpo, crawler ou tentativas de login. Máximo de 80 mapeamentos, timeout por requisição até 5 segundos, sem retries.

**Atenção:** NÃO testa certificado TLS real ou DNS externo: `X-Forwarded-Proto` não é prova de que uma URL pública esteja configurada corretamente. O proxy de staging deve estar sob controle do operador e ter sua identidade validada fora desta ferramenta. Não apontar a porta para outro contêiner ou serviço Imagine (CRM/Sites/Portal).

## Execução privada

A ferramenta requer `APP_ENV=staging` ou `testing`, `SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK`, sinalizador de linha de comando e manifesto F127 previamente aprovado para ensaio:

```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/capture-staging-301-loopback.mjs \
  --manifest /AREA-PRIVADA/legacy-plan.json \
  --out /AREA-PRIVADA/http-receipts.json \
  --port 18290 \
  --enable-loopback-probe
```

`/AREA-PRIVADA/http-receipts.json` deve ser caminho **absoluto**, fora da árvore Git e deve ainda não existir. O comando cria o arquivo uma única vez com permissões `0600`, sem overwrite. Contém URLs legadas, mapeamentos e comprovantes, portanto **não** enviar ao GitHub, e-mail ou chat, nem colocar logs no stdout. O stdout contém somente o resumo F134 sanitizado; a falha retorna erro genérico sem caminho/URL. Exit `0` = coerência em laboratório para revisão humana, `2` = desvio HTTP, `1` = erro/entrada insegura.

## Provas automáticas

Testes Node 22/24 criam servidor HTTP local efêmero `127.0.0.1`, exercitam quatro HEAD por dois mapeamentos, distinguem Host e esquema, falhas de Location externas sem persegui-las, porta inválida/opt-in ausente, arquivo privado exclusivo `0600` e link simbólico recusado.

## Gates remanescentes

1. Executar staging exclusivo no Leaseweb, inventariar ports/volumes/rede, não interferir com CRM, Sites ou Portal.
2. Configurar o proxy local de staging com as regras e o HTML realmente aprovados, não apenas fixture sintética; a equipe deve confirmar a equivalência das rotas.
3. Capturar HTTPS público autorizado separadamente com TLS/SNI e IP verificados, sem SSRF; reconciliar com GSC autenticado por empresa.
4. Rodar F134/F137 nos comprovantes privados, revisar canonical/hreflang/sitemap e conteúdo editorial.
5. Revisar segurança, testar restore/rollback, obter aceite humano antes de qualquer merge, DNS, publicação ou migração.

**Esta entrega não inicia contêiner, modifica nginx, abre porta, publica páginas nem valida servidor remoto.**
