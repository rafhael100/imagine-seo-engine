# SEO-F23 — Integridade de GSC sem acesso à API

Ajustes de qualidade e isolamento de contrato:
- Uma resposta GSC fornecida offline deve ter consultas únicas e sequência de cliques não crescente, consistente com Search Analytics;
- O adaptador recusa identificadores de tenant malformados, fingerprint inválido e alteração do marcador de autorização (continua **não verificada**);
- Linhas com zero impressões não podem declarar CTR maior que zero, evitando exibir uma métrica impossível;
- `minImpressions` requer inteiro seguro.

Todos os testes trabalham com dados artificiais em memória. Essas validações não autenticam a origem e não substituem o Portal com grants reais, OAuth e auditoria.
