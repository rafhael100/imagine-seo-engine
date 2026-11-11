# SEO-F75 — CLI offline do envelope de revisão do Portal

Comando local: `node scripts/prepare-portal-query-page-review-offline.mjs <private-evidence.json>`.

A entrada (fora de Git/CI quando real) contém `sourceRevision` SHA40, o plano F71 e páginas originais F72. O output usa o envelope F74 com apenas contagens, datas e códigos de revisão. Nenhum nome de consulta, URL de página, caminho privado ou segredo é emitido. O arquivo tem limite de 10 MiB e leitura sem seguir symlink final. Entradas adulteradas, JSON inválido e flags extras falham com diagnóstico sanitizado.

Nenhum sinal quando há linhas ocultadas ou página final cheia. Mesmo quando há sinal, **não é comprovação de canibalização** e nunca gera 301, publicação ou recomendações automáticas.

Sem autenticação de tenant, OAuth, Google HTTP, armazenamento de clientes, deploy ou merge na main. O envelope mantém todas as flags de privilégio em falso, aguardando integração autenticada do Portal e revisão LGPD/AppSec.
