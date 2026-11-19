# SEO F218 — comando do operador para GET público de canonical

Somente após revisão da lista pública e do plano de observação autorizado,
o operador pode iniciar a coleta de destinos canonical do domínio da Imagine.
A ferramenta recebe JSON de páginas HTTP 200 (esquema F217) em arquivo
exclusivo 0600 e diretório privado 0700, ambos fora do Git. Não busca HTML
das páginas, só status HTTP dos destinos canonical validados.

Exemplo em ambiente privado do operador:
IMAGINE_SEO_HTTP_CAPTURE=1 node scripts/capture-canonical-http-operator.mjs --pages /CAMINHO_PRIVADO/pages.json --output /CAMINHO_PRIVADO/observations.json

A saída privada é o envelope F215/F216. Para revisar:
IMAGINE_SEO_CANONICAL_REVIEW=1 node scripts/review-canonical-target-http-offline.mjs /CAMINHO_PRIVADO/observations.json

Regras: origem HTTPS pública fixa; máximo de 50 GETs seriados, sem cookie,
credencial, POST ou redirects; timeout canônico 1000–10000 ms por requisição
(padrão 7000, IMAGINE_SEO_HTTP_TIMEOUT_MS); nenhum corpo HTML preservado.
Qualquer erro bloqueia a captura e não publica resultado parcial.
CI usa somente fetch sintético, e captura real fica bloqueada no GitHub Actions.

Mesmo que a captura termine, isso não comprova indexação, conteúdo equivalente,
destino final de 302 ou autorização de publicação. Redirecionamentos: zero.
