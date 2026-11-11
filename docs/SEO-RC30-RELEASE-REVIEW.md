# RC30 — Checklist de revisão (F0–F72)

**Escopo:** RC29 F0–F66, somada às seguintes melhorias offline:

| ID | Mudança | PR de origem |
| --- | --- | --- |
| F67 | Suprime sinal de evolução quando há linhas de consultas/páginas ocultadas | #99 |
| F68 | Identifica a mesma página apesar de variação de capitalização do host | #100 |
| F69 | Bloqueia caminhos com percent-encoding de controles ou dupla decodificação | #101 |
| F70 | Omite consultas com documentos brasileiros pontuados | #102 |
| F71 | Planeja leitura read-only Search Analytics por query/page em até quatro páginas | #103 |
| F72 | Vincula respostas offline ao plano exato e revalida página, tenant e propriedade | #104 |

## Evidências e gates

- Testes sintéticos em Node 22/24 pelo workflow offline devem ser revisados no PR da RC30 antes de qualquer liberação. Confirmações anteriores: F67 #99, F68 #100, F69 #101 e F70 #102 tiveram seus respectivos CIs com sucesso em 11/11/2026; F71/F72 exigem consulta atual de CI.
- Verificar ausência de token/OAuth em Git ou artefatos, ausência de acesso externo nas novas CLIs e nenhuma exposição de termos/URLs brutas nas saídas dos relatórios.
- Revisores independentes de AppSec, LGPD e integração de backend Portal devem avaliar permissões, isolamento multiempresa e contratos antes de homologação.
- A própria existência de blueprint de Google não comprova OAuth autorizado, controle de acesso na propriedade ou consentimento auditado.
- Migração de leitores F59 v2 e adoção dos novos F71/F72 são **opt-in**, via pin de SHA e homologação dos consumidores. Não substituir contratos em produção silenciosamente.

## HOLD explícito

Sem chamadas Google reais, secret, refresh token, dados de clientes em Git/CI, exibição real no Portal, publicação SEO automática, alteração de DNS/301, faturamento, deploy ou merge `main`.

**Status:** `HOLD_EXTERNAL_BACKEND_VERIFICATION` até completar CI RC30, revisão independente e homologação autenticada do Portal. PR deliberadamente draft.
