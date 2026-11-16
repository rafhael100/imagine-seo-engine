# RC23 — Imagine SEO Engine F0–F58

RC22 F0–F56 mais:
- **F57:** auditoria offline de respostas GSC com dimensões `query,page`, vínculo estrito à empresa e propriedade canônica, detecção de consultas associadas a múltiplas páginas e saída **somente agregada**; os dados pessoais são filtrados antes da agregação
- **F58:** CLI privada com arquivo limitado a 5 MiB, parse seguro, rejeição de symlink, sem rede e sem impressão dos termos/URLs

CI verificada:
- [F57 Node 22/24 — SUCCESS](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42956514850)
- [F58 Node 22/24 — SUCCESS](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42956789322)
- [RC22 Node 22/24 — SUCCESS](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42955830016)

Consulta independente da propriedade `sc-domain:imaginecomunicacao.com.br` via OpenSEO (08/08 a 08/11/2026) mostrou 411 linhas da dimensão query/page, com 71 consultas associadas a mais de uma página; **não há termos ou URLs reais gravados neste código/repositório/CI**. Sobreposição não é prova de canibalização.

**HOLD**: nenhuma autenticação Google própria do Portal ou concessão de exibição foi implementada; sem produção, DNS, 301, deploy, `main` ou novas despesas. Exige revisão independente SEG/DBA/LGPD e homologação autenticada.
