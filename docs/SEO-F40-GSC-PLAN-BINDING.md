# SEO-F40 — Vínculo offline de propriedade GSC e plano de consulta

A pré-verificação offline F39 compara uma lista de propriedades declarada pelo operador. O planejador F10 produz uma URL de consulta e um fingerprint da propriedade. Sem uma checagem adicional, uma futura camada HTTP poderia usar uma URL diferente daquela cujo fingerprint foi aprovado pelo operador.

`bindOfflineGscPlanToPreflight` exige:
- tenant idêntico, fingerprint idêntico e estrutura de contratos conhecida;
- URL Google Search Analytics oficial, com propriedade canônica exatamente igual ao fingerprint, sem redirecionamento para host alternativo;
- escopo `webmasters.readonly`, POST, dimensão query, período final, sem networkPerformed;
- recusa qualquer preflight que declare OAuth, consentimento, grant Portal ou produção liberados.

Saída sempre `HOLD_EXTERNAL_BACKEND_VERIFICATION`. Esta validação **não confirma** nenhum acesso real e não usa token. O backend deverá validar independentemente a sessão, escopos, propriedade e permissões antes de consultar Google.
