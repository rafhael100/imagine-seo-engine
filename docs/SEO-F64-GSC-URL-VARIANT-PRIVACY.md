# SEO-F64 — Proteção de parâmetros privados em URLs do Google Search Console

A análise `query,page` da F57 agora diferencia URL canônica válida, URL com parâmetros da mesma propriedade e URL insegura/externa. URLs com `?` podem conter identificadores de sessão, endereços e tokens; elas são **contabilizadas como linhas omitidas por privacidade**, sem entrar nas métricas de consultas sobrepostas, sem preservar o caminho ou a string de consulta. Isso permite continuar o restante de um lote GSC legítimo sem publicar dados privados nem rejeitar todo o relatório.

O host e o caminho são validados antes do descarte. URLs externas, escapes de travessia, segmentos ambíguos, portas explícitas, fragmentos, credenciais e esquemas HTTP continuam recusados. Consultas pessoais seguem ocultadas. O comportamento vale também para a paginação F59 e a CLI F60.

Contratos de relatório v1/v2 permanecem inalterados: `receivedRows` inclui linhas omitidas; `redactedRows` conta registros suprimidos; `analyzedRows` apenas os efetivamente analisados. A CI utiliza dados falsos. **HOLD:** nenhum OAuth/Google real no motor/Portal, dados de clientes no Git, deploy, DNS, 301 ou merge `main`.
