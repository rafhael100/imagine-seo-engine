# RC20 — Imagine SEO F0–F53

Consolida RC19/F0–F51 mais F52 (normalizador offline para a dimensão `date` do GSC com contagem explícita dos dias sem observações) e F53 (CLI privada local, entrada limitada a 1 MiB, diagnósticos seguros). Contadores e CTR são recalculados somente das linhas recebidas, nunca de uma extrapolação de tráfego.

Evidências: [CI F52 aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42950041273), [CI F53 aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42950209428), [RC19 aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42949360303). A propriedade Imagine no OpenSEO passou a responder em modo readonly, mas nenhuma credencial/OpenSEO foi incorporada ao motor.

**HOLD**: sem merge `main`, deploy, OAuth próprio do Portal, dados reais no Git, aprovação de 301, DNS ou autorização de produção. Homologação, LGPD, IAM/MFA e revisão independente ainda são necessárias.
