# Imagine SEO Offline RC21 — Consolidação F0–F55

Base RC20 F0–F53, mais:
- **F54** — Comparação offline de dois períodos GSC na dimensão `date`: revalidação de métricas e escopo, janelas iguais e não sobrepostas, cobertura de datas explícita, revisões de queda apenas quando ambas as séries forem completas dentro dos dados fornecidos
- **F55** — CLI local para executar F54 com leitura limitada a 1 MiB e diagnósticos sanitizados, sem Google HTTP ou informações reais em CI

Evidências verificadas:
- [SEO-F54 CI Node 22/24 aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42954752684)
- [SEO-F55 CI Node 22/24 aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42954897525)
- [RC20 CI aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42950805599)
- [Portal F138 Node→PHP CI aprovado](https://github.com/rafhael100/imagine-portal/actions/runs/42955193052)
- [Portal F139 HTML estático CI aprovado](https://github.com/rafhael100/imagine-portal/actions/runs/42955395706)

A CI usa somente contextos sintéticos. A conexão de domínio Google no OpenSEO permanece separada do backend Imagine Portal e não é autorização de lançamento. **HOLD:** sem merge na `main`, OAuth próprio, dados reais no Git, deploy, DNS, redirects 301, custos ou publicação. Revisão independente de IAM/AppSec/DBA/LGPD, consentimento e staging seguem necessários.
