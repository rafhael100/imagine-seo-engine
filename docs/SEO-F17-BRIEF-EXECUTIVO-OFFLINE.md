# SEO-F17 — Relatório executivo seguro para o Portal (contrato offline)

A função `buildOfflineSeoBrief({audit,trend})` produz `seo-brief-offline-v1`, um objeto compacto com:
- Situação técnica baseada apenas na auditoria fornecida (quantidade de páginas, erros e avisos);
- Variação agregada de cliques/impressões, somente quando foi fornecido um resultado compatível do comparador de períodos GSC;
- Códigos fechados de tarefas para revisão humana, com prioridade e quantidade, sem executar qualquer correção;
- Avisos claros sobre procedência não verificada, limitações estatísticas e ausência de acesso Google.

A função descarta todos os nomes de arquivos, rotas, consultas brutas, cluster names e mensagens livres das entradas. Códigos desconhecidos são tratados como categoria genérica, nunca repetidos.

CLI: `node scripts/report-seo-brief-offline.mjs audit.json [trend.json]`.

**Integração real:** antes de expor relatórios no Portal, é necessário autenticação e autorização por empresa, identificação de propriedade validada, minimização LGPD, logs e revisão de proveniência. Este contrato não implementa isso e não substitui integração segura.
