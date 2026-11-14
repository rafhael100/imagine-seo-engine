# SEO-F101 — Integridade do cluster de traduções hreflang

## Defeito prevenido

A reciprocidade individual não garante um conjunto completo de alternates:
PT ↔ EN e EN ↔ ES podem estar corretos enquanto PT omite ES. O Google
poderia receber grupos divergentes mesmo com todos os pares presentes.

## Comportamento

- Com `--multilingual --check-hreflang`, cada página que declara versões
  linguísticas deve concordar com todos os destinos relacionados sobre o
  conjunto inteiro de `hreflang`, inclusive `x-default` quando presente.
- A comparação usa apenas mapas locais obtidos dos cabeçalhos HTML reais,
  depois de normalizar as URLs canônicas e confirmar a existência dos
  arquivos. Um grupo de duas ou três traduções pode conter linguagens
  legítimas distintas; não força a existência de uma versão inexistente.
- `hreflang_cluster_inconsistent` é um erro genérico, sem texto/URL de
  entradas privadas, não uma sugestão automática de gerar traduções.
- Se não houver `--check-hreflang`, nenhuma checagem de cluster é acionada.
- O limite anterior de 16 alternates por página e os limites de findings
  permanecem; sem rede, Google API, publicação ou acesso a dados reais.

## Testes

```bash
npm test
node scripts/audit-dist.mjs dist https://imaginecomunicacao.com.br/ --strict-public-head --multilingual --check-hreflang --fail-on-warnings
```

Regressões cobrem trio PT/EN/ES completo, trio parcial com reciprocidade
individual preservada e `x-default` incompatível entre duas versões.

## Evidência de integração existente

O Imagine Comercial, PR #383, HEAD
`2f9c65f613859a4105395370672de0b5c88132b4`,
já teve build Astro e auditoria F100 aprovados em GitHub Actions:
https://github.com/rafhael100/imagine-comercial/actions/runs/43604390421

F101 ainda deve passar na HEAD exata e, depois, repetir a checagem no
build real dessa mesma revisão do Comercial sem alterar seu pin de produção.
Não confundir evidência estática de CI com SEO real, consentimento Google,
homologação de produção ou publicação.

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
