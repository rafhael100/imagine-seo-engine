# SEO F217 — captura pública limitada de HTTP para destinos canonical

A origem é fixa em https://www.imaginecomunicacao.com.br, sem URLs dinâmicas
de clientes. A captura recebe declarações previamente observadas, validadas
antes de qualquer acesso. Cada destino canonical distinto é consultado
no máximo uma vez, com GET anônimo, sem cookies, sem redirects, sem retry,
sem POST e com timeout por requisição de 1 a 10 segundos.

O corpo HTML nunca é retido. Para status 200 exige Content-Type text/html;
3xx/4xx/5xx são observados como estado, não seguidos. Qualquer erro interrompe
toda a captura sem devolver conjunto parcial. Limite: 50 destinos distintos.

O resultado é o envelope esperado pelo F215/F216, mas não autentica a
procedência da página, não comprova indexação ou equivalência editorial,
e não autoriza publicação nem regras 301.

Os testes injetam respostas HTTP sintéticas: nenhuma rede é utilizada em CI.
Execução operacional real exige infraestrutura e consentimento de revisão
da origem pública, sob controle do operador, fora das Actions.
