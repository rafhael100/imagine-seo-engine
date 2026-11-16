# SEO-F104 — ponte OpenSEO → revisão diária offline

## Objetivo

A propriedade Imagine pode estar conectada ao Search Console dentro do OpenSEO; isso não transfere OAuth, consentimento ou acesso por tenant ao Imagine Portal. A F104 aceita apenas um snapshot local de métricas **agregadas por data**, e utiliza o validador GSC diário existente.

## Contrato de entrada: exemplo fictício

```json
{
  "tenantRef": "imagine-demo",
  "expectedProperty": "sc-domain:imaginecomunicacao.com.br",
  "snapshot": {
    "siteUrl": "sc-domain:imaginecomunicacao.com.br",
    "startDate": "2026-10-15",
    "endDate": "2026-10-17",
    "dimensions": ["date"],
    "rows": [
      {"keys":["2026-10-15"],"clicks":1,"impressions":10,"ctr":0.1,"position":8},
      {"keys":["2026-10-17"],"clicks":2,"impressions":20,"ctr":0.1,"position":9}
    ],
    "rowCount": 2,
    "hasMore": false
  }
}
```

Dados fictícios, não representam acessos reais nessas datas. Em ambiente local privado:

```bash
node scripts/review-openseo-daily-offline.mjs private-daily-snapshot.json
```

## Política

- Arquivo UTF-8 até 256 KiB, sem symlinks na entrada final; diretórios pais devem ser confiáveis.
- Objetos de esquema fechado, atributos próprios enumeráveis e sem getters, symbols ou grants declarados.
- Propriedades correspondem exatamente na sua forma canônica; domínio GSC e URL-prefix são tipos distintos.
- Aceita somente a dimensão data, com no máximo 92 dias e linhas; rejeita dados de consulta, página, país e dispositivo.
- Recusa páginas de resultado incompletas, contagens divergentes, datas inválidas ou duplicadas e métricas inconsistentes.
- Datas ausentes permanecem desconhecidas, nunca equivalem a zero. Dados fornecidos pelo operador podem estar incompletos.
- Não retorna URL da propriedade, tokens, termos de busca nem valores de origem arbitrários.
- Todos os campos de autorização do SaaS Imagine ficam permanentemente falsos. O status final é HOLD_IMAGINE_BACKEND_AUTHORIZATION.

## Pendências para operação

Backend do Portal com autenticação, RBAC/MFA, grants de propriedade e tenant, OAuth autorizado, LGPD, segregação de segredos, observabilidade, staging, backup, rollback e revisão independente. Esse adaptador não comprova origem Google/OpenSEO e não faz chamadas à rede. Não colocar dados reais no GitHub.

**DRAFT / NO-MERGE / NO-DEPLOY.**
