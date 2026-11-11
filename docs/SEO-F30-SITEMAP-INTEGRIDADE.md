# SEO-F30 — Sitemap offline com proteção contra URLs falsas
O motor antes extraía qualquer texto entre `<loc>` e `</loc>`, inclusive quando o elemento aparecia apenas dentro de `<!-- comentário -->`.

O verificador de sitemap agora:
- ignora comentários XML;
- requer um `urlset` básico e pelo menos um elemento `loc`;
- bloqueia DTD, fragmento URL, domínio diferente e forma não canônica da URL;
- não coloca conteúdo bruto da URL suspeita na mensagem de erro.

A verificação permanece limitada ao inventário de rotas do build estático: não há HTTP, consulta Google ou parsing XML normativo, e nenhuma garantia de indexação.
