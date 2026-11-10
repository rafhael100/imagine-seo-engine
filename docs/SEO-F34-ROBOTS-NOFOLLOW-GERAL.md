# SEO-F34 — Revisão de meta robots nofollow

O controle específico `googlebot=nofollow` já era detectado, mas a regra geral `meta name="robots" content="nofollow"` ainda poderia passar em modo não estrito. Esta mudança trata `nofollow` como indicação de revisão de indexação/navegação, sem alegar que a página foi removida do Google.

Os tokens do cabeçalho são normalizados em minúsculas e separados por vírgula ou espaços. Comentários e conteúdo do corpo não são evidência de diretivas válidas.

Não verifica `X-Robots-Tag` do servidor, nem substitui homologação HTTP e permissão real da propriedade GSC. Sem deploy ou Google online.
