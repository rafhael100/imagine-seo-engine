# SEO F151 — conferir o contêiner Docker em execução, não apenas o Compose

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC56 #221](https://github.com/rafhael100/imagine-seo-engine/pull/221) e F150 [#220](https://github.com/rafhael100/imagine-seo-engine/pull/220). A prova de configuração declarada não é igual à configuração efetivamente aplicada pelo Docker.

## Implementação

`reviewRunningStagingContainer({inspect,expected})` é um auditor offline de snapshot Docker. O F150 integra esse auditor diretamente ao teste com **o Compose gerado pela F149 e o Nginx real**, antes de autorizar a conclusão do HTTP 301/HTML GET.

O auditor compara os campos que o Docker diz ter aplicado:

- Imagem declarada com **digest SHA fixo**, sem tag mutável isolada; contêiner em execução e com healthcheck saudável.
- Usuário `101:101`, rootfs read-only, sem modo privilegiado, capacidades removidas e `no-new-privileges`.
- Memória, CPU e limites PID observados; configurações inconsistentes bloqueiam.
- Porta publicada **somente em 127.0.0.1**, exatamente a selecionada no inventário; recusa portas extras.
- Exatamente dois bind mounts `read-only` para HTML compilado e configuração Nginx aprovada, sem acesso ao socket Docker.
- Uma rede com nome exclusivo previsto, sem `network_mode: host`, `pid: host` ou `ipc: host`, tmpfs limitado, política de restart `no`.
- Relatório somente com flags e códigos. **Nunca imprime** output bruto do `docker inspect`, que pode conter variáveis de ambiente, nomes, IDs, IPs ou caminhos privados.

## CI real e cenários adversariais

A CI Node 22/24 cria fixture sintética (`example.test`), gera Nginx F145, Compose F149, inicia o contêiner em projeto descartável e consulta `docker compose ps -q nginx` e `docker inspect` com dados brutos mantidos somente em memória. O auditor deve passar **antes** de F143 (GSC por página, redirecionamentos, bytes HTML servidos e SHA).

Os testes de unidade simulam contêiner com rootfs gravável, `privileged`, usuário root, tag mutável, porta `0.0.0.0`, rede pública extra, bind mount Docker socket, recurso divergente, healthcheck falho e restart automático. Todos devem bloquear sem divulgação de segredos.

## Limites relevantes

Um snapshot Docker é uma declaração do daemon consultado e não comprova, por si só, identidade da VPS, isolamento efetivo de egress, segurança do kernel, CVEs de imagem, TLS público, backups ou ausência de acesso administrativo. Um operador com controle do daemon pode forjar sua configuração; exigir identificação da VPS no painel Leaseweb e revisão independente.

O comando de CI com `docker inspect` foi destinado **apenas ao runner descartável**, sem acesso ao Docker de produção. Não orientar o operador a coletar/colar saída bruta do inspect em PR/chat. A coleta na Leaseweb e o ensaio real exigem isolamento, autorização e proteção de dados.

**Status: candidato somente a revisão humana, nunca autorização de merge, deploy ou mudança DNS.**
