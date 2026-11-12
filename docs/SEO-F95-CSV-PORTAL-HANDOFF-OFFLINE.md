# SEO-F95 — CSV manual até revisão offline do Imagine Portal

Este comando facilita a análise de dois arquivos **CSV de consultas** exportados
manualmente do Search Console, sem login Google, OAuth, APIs, publicação, conta
ou dados persistidos pelo motor. Requer diretório de trabalho privado e
exportações cuja utilização tenha sido autorizada pelo responsável.

## Manifesto de exemplo (dados sintéticos)

Salve `private-manifest.json` ao lado dos CSVs e da auditoria:

```json
{
  "auditFile": "audit.json",
  "previous": {
    "file": "before.csv",
    "startDate": "2026-10-01",
    "endDate": "2026-10-07"
  },
  "current": {
    "file": "after.csv",
    "startDate": "2026-10-08",
    "endDate": "2026-10-14"
  },
  "scope": {
    "tenantRef": "imagine-demo",
    "propertyFingerprint": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "sourceRevision": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  }
}
```

A auditoria `audit.json` deve ser relatório válido emitido pelo auditor
estático. Os CSVs precisam ter cinco colunas de Consultas/Clicks/Impressions/CTR/
Position e linhas com métricas coerentes. **F96 exige arquivos no mesmo diretório
do manifesto, referenciados somente por nomes de arquivo** com extensão .json
(auditoria) ou .csv (exportações). Caminhos absolutos, aninhados, com `..` ou
para outro diretório são recusados antes de abrir a entrada.
**F97 valida todos os nomes dos arquivos antes de ler qualquer evidência.**
O CSV do período anterior e o CSV do período atual devem ter nomes diferentes
(incluindo diferença apenas de maiúsculas/minúsculas). Dois arquivos distintos
podem, legitimamente, conter métricas iguais; o motor não inventa mudanças.
Use somente um diretório privado com ancestrais confiáveis.

```bash
node scripts/prepare-portal-gsc-csv-handoff-offline.mjs private-manifest.json
```

O resultado usa o contrato `seo-portal-original-gsc-handoff-offline-v1`
da F88, sem oferecer autorização a cliente, publicação ou ranking garantido.
O filtro F89/F93 suprime **todos** os indicadores orgânicos quando alguma linha
é identificada como pessoal; textos e URLs da fonte não são impressos.
Apenas ações técnicas independentes podem permanecer.

## Limites e gates

- O manifesto não é comprovante de OAuth, consentimento, propriedade ou grant
  multiempresa; os identificadores são autodeclarados.
- Paginação, anonimização e amostragem do Google podem omitir consultas.
- Arquivos regulares locais com UTF-8 estrito e limite por entrada: manifesto
  32 KiB, auditoria 2 MiB, cada CSV 10 MiB. Symlink final recusado.
- Não guardar manifesto/CSV de cliente no GitHub nem transmitir a terceiros;
  essa CLI não armazena resultados, mas o usuário deve proteger seu terminal.
- **NO-GO** para produção: exige revisão AppSec/LGPD, autenticação e grants
  reais pelo Portal, teste em staging, rollback e aprovação de liberação.
