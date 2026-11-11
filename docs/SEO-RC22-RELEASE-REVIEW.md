# SEO Offline RC22 — F0–F56

Reúne o motor e as entregas anteriores (RC21 F0–F55) com:
- **F56:** integração da comparação de períodos GSC F54 ao relatório `seo-brief-offline-v1` existente no Portal
- Revalidação obrigatória dos arquivos originais; nunca aceita alegações de autorização ou métricas calculadas fora do motor
- Dados de dias ausentes ou possível paginação incompleta resultam na omissão **total** das métricas de tendência no contrato de exibição antiga; sem falsos alertas
- Compatibilidade exercitada com `preparePortalSeoHandoff` e contratos F24/F79

Evidências verificadas: [RC21 CI aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42955528378), [F56 CI aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42955736831), [Portal F139 CI aprovado](https://github.com/rafhael100/imagine-portal/actions/runs/42955395706).

Release **HOLD**: não há autenticação real do backend Portal, OAuth/Google no motor, dados privados em Git ou CI, deploy, redirect 301, DNS, merge `main` ou despesa nova. Homologação com identidade real e revisão independente AppSec/DBA/LGPD permanecem gates.
