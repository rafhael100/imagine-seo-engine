# SEO-F55 — Relatório comparativo diário GSC por CLI privada

Use `node scripts/compare-gsc-daily-offline.mjs /caminho/privado/duas-janelas.json` com JSON contendo somente `previous` e `current`; cada lado possui `scope` e `response` do contrato F52. O arquivo é lido do disco local por leitor seguro, até 1 MiB, sem seguir symlinks finais. A saída é a análise F54 com cobertura, totais, variações e sinais de revisão quando elegíveis.

A operação não cria relatórios remotos nem contato com API Google ou OpenSEO; não revela o conteúdo de arquivos em erro e não autoriza OAuth, tráfego de clientes ou publicação. Nunca inclua exportações pessoais ou reais no GitHub ou CI.

**HOLD** até IAM/MFA, consentimento, verificação do tenant/propriedade, homologação e revisão independente. Sem deploy ou merge na main.
