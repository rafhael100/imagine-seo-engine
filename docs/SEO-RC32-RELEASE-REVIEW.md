# RC32 — Revisão e aceitação F0–F78

Incremento sobre RC31 (#110):
- F77 (#111): CI inspeciona módulos locais `src/` e `scripts/` para bloquear padrões comuns de chamadas HTTP/socket acidentais; controle heurístico, não substitui sandbox e revisão AppSec.
- F78 (#112): README atualizado com estágio real, CLIs de GSC query/page, contratos de Portal e limites de autenticação.

A suite Node 22/24 deve passar na PR RC32. Preservar a revisão independente de segurança e LGPD, a futura conexão OAuth real do Google Search Console sob grants autenticados, a validação de propriedade e a homologação de integração entre Portal e SEO.

**Sem deploy, publicação, DNS/301, faturamento, tokens, dados de clientes em Git/CI ou merge main.** O estado permanece `HOLD_EXTERNAL_AUTHORIZATION`; dados locais e SHAs não atestam consentimento. Não liberar cliente ou integração baseada apenas em teste sintético.
